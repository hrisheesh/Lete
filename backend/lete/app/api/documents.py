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
        parser = ParserRegistry.get_parser(ext)
        sections = parser.parse(file_path, document_id)
        
        # Clear existing sections just in case
        section_repo.delete_by_document(document_id)
        
        # Save sections
        for section in sections:
            section_repo.create(section)
            
        # Update Job Status
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

