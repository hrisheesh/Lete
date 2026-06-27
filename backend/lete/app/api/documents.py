import os
import shutil
import hashlib
import sqlite3
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from lete.app.api.deps import get_db_connection
from lete.app.schemas.document import DocumentCreate, DocumentResponse
from lete.app.repositories.document import DocumentRepository

router = APIRouter()

UPLOAD_DIR = "data/documents"


@router.post("/workspaces/{workspace_id}/documents/upload", response_model=DocumentResponse)
async def upload_document(
    workspace_id: str,
    file: UploadFile = File(...),
    conn: sqlite3.Connection = Depends(get_db_connection),
):
    import uuid
    try:
        uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workspace ID format")

    repo = DocumentRepository(conn)
    
    # Ensure directory exists
    workspace_dir = os.path.join(UPLOAD_DIR, workspace_id)
    os.makedirs(workspace_dir, exist_ok=True)
    
    import uuid
    # Stream file to compute hash and size without memory bloat
    temp_file_path = os.path.join(workspace_dir, f"temp_{uuid.uuid4()}")
    file_size = 0
    sha256 = hashlib.sha256()
    
    with open(temp_file_path, "wb") as f:
        while chunk := await file.read(8192):
            f.write(chunk)
            sha256.update(chunk)
            file_size += len(chunk)
            
    file_hash = sha256.hexdigest()
    
    # Check for duplicates
    existing_doc = repo.get_by_hash(workspace_id, file_hash)
    if existing_doc:
        os.remove(temp_file_path)
        raise HTTPException(status_code=409, detail="Duplicate file detected")
        
    # Move temp file to final destination
    file_path = os.path.join(workspace_dir, file_hash)
    os.rename(temp_file_path, file_path)
        
    # Save metadata to DB
    doc_create = DocumentCreate(
        workspace_id=workspace_id,
        filename=file.filename or "unknown",
        file_type=file.content_type,
        file_size=file_size,
        file_hash=file_hash,
        status="pending"
    )
    
    return repo.create(doc_create)


@router.get("/workspaces/{workspace_id}/documents", response_model=List[DocumentResponse])
def list_documents(
    workspace_id: str,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    repo = DocumentRepository(conn)
    return repo.list_by_workspace(workspace_id)


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(
    document_id: str,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    repo = DocumentRepository(conn)
    doc = repo.get(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete from DB
    repo.delete(document_id)
    
    # Delete from disk
    file_path = os.path.join(UPLOAD_DIR, doc.workspace_id, doc.file_hash)
    if os.path.exists(file_path):
        os.remove(file_path)
        
    return None

from lete.app.schemas.job import ProcessingJobCreate, ProcessingJobResponse, ProcessingJobUpdate
from lete.app.schemas.section import DocumentSectionResponse
from lete.app.repositories.job import ProcessingJobRepository
from lete.app.repositories.section import DocumentSectionRepository
from lete.app.parsing.registry import ParserRegistry

@router.post("/documents/{document_id}/process", response_model=ProcessingJobResponse)
def process_document(
    document_id: str,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    doc_repo = DocumentRepository(conn)
    job_repo = ProcessingJobRepository(conn)
    section_repo = DocumentSectionRepository(conn)
    chunk_repo = ChunkRepository(conn)
    
    doc = doc_repo.get(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Create Job
    job = job_repo.create(ProcessingJobCreate(
        document_id=document_id,
        status="parsing"
    ))
    
    file_path = os.path.join(UPLOAD_DIR, doc.workspace_id, doc.file_hash)
    ext = doc.filename.split('.')[-1].lower() if '.' in doc.filename else 'txt'
    
    try:
        # Phase 1: Parse sections
        parser = ParserRegistry.get_parser(ext)
        sections = parser.parse(file_path, document_id)
        
        section_repo.delete_by_document(document_id)
        created_sections = []
        for section in sections:
            created = section_repo.create(section)
            created_sections.append(created)
            
        # Update job to chunking phase
        job = job_repo.update(job.id, ProcessingJobUpdate(status="chunking"))
        
        # Phase 2: Chunk sections
        chunk_repo.delete_by_document(document_id)
        chunker = RecursiveChunker()
        chunk_index = 0
        
        created_chunks = []
        for section in created_sections:
            raw_chunks = chunker.chunk(section.content)
            for rc in raw_chunks:
                header = generate_contextual_header(
                    document_name=doc.filename,
                    chunk_text=rc,
                    page_number=section.page_number,
                    section_index=section.section_index
                )
                
                chunk = chunk_repo.create(ChunkCreate(
                    document_id=document_id,
                    section_id=section.id,
                    text=rc,
                    contextual_header=header,
                    chunk_index=chunk_index,
                    token_count=len(rc) // 4
                ))
                created_chunks.append(chunk)
                chunk_index += 1
                
        # Phase 3: Embeddings
        job = job_repo.update(job.id, ProcessingJobUpdate(status="embedding"))
        
        from lete.app.api.settings import get_settings
        from lete.app.providers.embeddings import OpenAIEmbeddingProvider
        from lete.app.repositories.embedding import EmbeddingRepository
        import sqlite_vec
        
        prov_settings = get_settings(conn)
        embed_provider = OpenAIEmbeddingProvider(
            api_key=prov_settings.api_key or "",
            model_name=prov_settings.embedding_model_name or "text-embedding-3-small",
            base_url=prov_settings.base_url
        )
        embed_repo = EmbeddingRepository(conn)
        
        texts_to_embed = [c.contextual_header + "\n\n" + c.text if c.contextual_header else c.text for c in created_chunks]
        
        cached = embed_repo.get_cached_embeddings(texts_to_embed)
        
        missing_texts = []
        for t in texts_to_embed:
            t_hash = hashlib.sha256(t.encode('utf-8')).hexdigest()
            if t_hash not in cached and t not in missing_texts:
                missing_texts.append(t)
                
        if missing_texts:
            new_embeddings = embed_provider.embed(missing_texts)
            binary_text_to_embedding = {
                txt: sqlite_vec.serialize_float32(emb) 
                for txt, emb in zip(missing_texts, new_embeddings)
            }
            embed_repo.cache_embeddings(binary_text_to_embedding)
            
            for txt, binary_emb in binary_text_to_embedding.items():
                t_hash = hashlib.sha256(txt.encode('utf-8')).hexdigest()
                cached[t_hash] = binary_emb

        embed_repo.delete_chunk_embeddings([c.id for c in created_chunks])
        
        chunk_id_to_embedding = {}
        for c in created_chunks:
            t = c.contextual_header + "\n\n" + c.text if c.contextual_header else c.text
            t_hash = hashlib.sha256(t.encode('utf-8')).hexdigest()
            chunk_id_to_embedding[c.id] = cached[t_hash]
            
        embed_repo.store_chunk_embeddings(chunk_id_to_embedding)
        
        # Update Job Status to completed
        job = job_repo.update(job.id, ProcessingJobUpdate(status="completed"))
        return job
        
    except Exception as e:
        # Clean up any chunks created in this failed run to prevent data leakage
        chunk_repo.delete_by_document(document_id)
        job = job_repo.update(job.id, ProcessingJobUpdate(status="failed", error_message=str(e)))
        return job

@router.get("/documents/{document_id}/sections", response_model=List[DocumentSectionResponse])
def get_document_sections(
    document_id: str,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    section_repo = DocumentSectionRepository(conn)
    return section_repo.list_by_document(document_id)

from lete.app.schemas.chunk import ChunkCreate, ChunkResponse
from lete.app.repositories.chunk import ChunkRepository
from lete.app.chunking.recursive_chunker import RecursiveChunker
from lete.app.chunking.context import generate_contextual_header

# The POST /chunk endpoint has been merged into POST /process

@router.get("/documents/{document_id}/chunks", response_model=List[ChunkResponse])
def get_document_chunks(
    document_id: str,
    conn: sqlite3.Connection = Depends(get_db_connection)
):
    chunk_repo = ChunkRepository(conn)
    return chunk_repo.get_by_document(document_id)
