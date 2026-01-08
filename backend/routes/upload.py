from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime
import uuid

from database import get_db
from models import Document
from document_parser import document_parser
from llm_service import llm_service

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = "uploads"

async def save_uploaded_file(file: UploadFile, doc_type: str, category: str) -> tuple:
    """Save uploaded file and return file path and metadata."""
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Create category directory if it doesn't exist
    category_dir = os.path.join(UPLOAD_DIR, f"{doc_type}s", category)
    os.makedirs(category_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(category_dir, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    return file_path, unique_filename, file_size

@router.post("/cv")
async def upload_cvs(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Upload one or more CV files."""
    results = []
    errors = []
    
    for file in files:
        try:
            # Validate file type
            if not document_parser.validate_file(file.filename):
                errors.append({
                    "filename": file.filename,
                    "error": "Unsupported file format. Only PDF and DOCX are supported."
                })
                continue
            
            # Save file temporarily to extract text
            temp_path = f"temp_{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Extract text
            text_content = document_parser.extract_text(temp_path)
            
            if not text_content:
                os.remove(temp_path)
                errors.append({
                    "filename": file.filename,
                    "error": "Could not extract text from file"
                })
                continue
            
            # Categorize using LLM
            category = await llm_service.categorize_document(text_content, "cv")
            
            # Move file to proper category folder
            file_ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            category_dir = os.path.join(UPLOAD_DIR, "cvs", category)
            os.makedirs(category_dir, exist_ok=True)
            final_path = os.path.join(category_dir, unique_filename)
            shutil.move(temp_path, final_path)
            
            file_size = os.path.getsize(final_path)
            
            # Save to database
            doc = Document(
                filename=unique_filename,
                original_name=file.filename,
                file_type="cv",
                category=category,
                file_path=final_path,
                file_size=file_size,
                text_content=text_content
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
            
            results.append({
                "id": doc.id,
                "filename": file.filename,
                "category": category,
                "status": "success"
            })
            
        except Exception as e:
            errors.append({
                "filename": file.filename,
                "error": str(e)
            })
            # Clean up temp file if it exists
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    return {
        "uploaded": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors
    }

@router.post("/jd")
async def upload_jd(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a Job Description file."""
    try:
        # Validate file type
        if not document_parser.validate_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Only PDF and DOCX are supported."
            )
        
        # Save file temporarily to extract text
        temp_path = f"temp_{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract text
        text_content = document_parser.extract_text(temp_path)
        
        if not text_content:
            os.remove(temp_path)
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from file"
            )
        
        # Categorize using LLM
        category = await llm_service.categorize_document(text_content, "jd")
        
        # Move file to proper category folder
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        category_dir = os.path.join(UPLOAD_DIR, "jds", category)
        os.makedirs(category_dir, exist_ok=True)
        final_path = os.path.join(category_dir, unique_filename)
        shutil.move(temp_path, final_path)
        
        file_size = os.path.getsize(final_path)
        
        # Save to database
        doc = Document(
            filename=unique_filename,
            original_name=file.filename,
            file_type="jd",
            category=category,
            file_path=final_path,
            file_size=file_size,
            text_content=text_content
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        return {
            "id": doc.id,
            "filename": file.filename,
            "category": category,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))
