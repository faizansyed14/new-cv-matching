from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from database import get_db
from models import Document

router = APIRouter(prefix="/api/documents", tags=["database"])

@router.get("")
async def get_documents(
    file_type: Optional[str] = Query(None, description="Filter by 'cv' or 'jd'"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    """Get all documents with optional filtering."""
    query = db.query(Document)
    
    if file_type:
        query = query.filter(Document.file_type == file_type)
    if category:
        query = query.filter(Document.category == category)
    
    documents = query.order_by(Document.upload_date.desc()).all()
    
    return {
        "total": len(documents),
        "documents": [
            {
                "id": doc.id,
                "filename": doc.original_name,
                "file_type": doc.file_type,
                "category": doc.category,
                "upload_date": doc.upload_date.isoformat(),
                "file_size": doc.file_size
            }
            for doc in documents
        ]
    }

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """Get all categories with document counts."""
    # Get all documents grouped by category and type
    documents = db.query(Document).all()
    
    categories = {}
    for doc in documents:
        if doc.category not in categories:
            categories[doc.category] = {"cvs": 0, "jds": 0}
        
        if doc.file_type == "cv":
            categories[doc.category]["cvs"] += 1
        else:
            categories[doc.category]["jds"] += 1
    
    return {
        "categories": [
            {
                "name": cat,
                "cv_count": counts["cvs"],
                "jd_count": counts["jds"],
                "total": counts["cvs"] + counts["jds"]
            }
            for cat, counts in categories.items()
        ]
    }

@router.get("/{document_id}")
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get document metadata by ID."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": doc.id,
        "filename": doc.original_name,
        "file_type": doc.file_type,
        "category": doc.category,
        "upload_date": doc.upload_date.isoformat(),
        "file_size": doc.file_size,
        "file_path": doc.file_path
    }

@router.get("/{document_id}/view")
async def view_document(document_id: int, db: Session = Depends(get_db)):
    """Serve the document file for viewing."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    # Determine media type based on file extension
    file_ext = os.path.splitext(doc.file_path)[1].lower()
    if file_ext == '.pdf':
        media_type = "application/pdf"
    elif file_ext in ['.docx', '.doc']:
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        media_type = "application/octet-stream"
    
    # Sanitize filename for HTTP header (remove non-ASCII characters)
    safe_filename = doc.original_name.encode('ascii', 'ignore').decode('ascii')
    if not safe_filename:
        safe_filename = f"document{file_ext}"
    
    return FileResponse(
        doc.file_path,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{safe_filename}"'
        }
    )

@router.delete("/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    
    # Delete from database
    db.delete(doc)
    db.commit()
    
    return {"status": "success", "message": "Document deleted"}
