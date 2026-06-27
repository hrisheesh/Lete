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
    repo = DocumentRepository(conn)
    
    # Ensure directory exists
    workspace_dir = os.path.join(UPLOAD_DIR, workspace_id)
    os.makedirs(workspace_dir, exist_ok=True)
    
    # Read file to compute hash and size
    content = await file.read()
    file_size = len(content)
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Check for duplicates
    existing_doc = repo.get_by_hash(workspace_id, file_hash)
    if existing_doc:
        raise HTTPException(status_code=409, detail="Duplicate file detected")
        
    # Save file to disk
    file_path = os.path.join(workspace_dir, file_hash)
    with open(file_path, "wb") as f:
        f.write(content)
        
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
        
        for section in created_sections:
            raw_chunks = chunker.chunk(section.content)
            for rc in raw_chunks:
                header = generate_contextual_header(
                    document_name=doc.filename,
                    chunk_text=rc,
                    page_number=section.page_number,
                    section_index=section.section_index
                )
                
                chunk_repo.create(ChunkCreate(
                    document_id=document_id,
                    section_id=section.id,
                    text=rc,
                    contextual_header=header,
                    chunk_index=chunk_index,
                    token_count=len(rc) // 4
                ))
                chunk_index += 1
                
        # Update Job Status to completed
        job = job_repo.update(job.id, ProcessingJobUpdate(status="completed"))
        return job
        
    except Exception as e:
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
