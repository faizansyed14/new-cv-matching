from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

from database import get_db
from models import Document, MatchResult
from llm_service import llm_service

router = APIRouter(prefix="/api/match", tags=["matching"])

class MatchRequest(BaseModel):
    jd_id: int
    cv_ids: Optional[List[int]] = None  # If None, match against all CVs
    model: Optional[str] = "openai"  # "openai" or "ollama"

@router.post("")
async def match_cvs_to_jd(
    request: MatchRequest,
    db: Session = Depends(get_db)
):
    """Match CVs against a Job Description."""
    # Get JD
    jd = db.query(Document).filter(
        Document.id == request.jd_id,
        Document.file_type == "jd"
    ).first()
    
    if not jd:
        raise HTTPException(status_code=404, detail="Job Description not found")
    
    # Get CVs
    if request.cv_ids:
        cvs = db.query(Document).filter(
            Document.id.in_(request.cv_ids),
            Document.file_type == "cv"
        ).all()
    else:
        # Match against all CVs
        cvs = db.query(Document).filter(Document.file_type == "cv").all()
    
    if not cvs:
        raise HTTPException(status_code=404, detail="No CVs found")
    
    # Prepare CV data for matching
    cv_data = [
        {
            "id": cv.id,
            "name": cv.original_name,
            "text": cv.text_content
        }
        for cv in cvs
    ]
    
    # Perform batch matching with selected model
    match_results = await llm_service.batch_match(cv_data, jd.text_content, request.model)
    
    # Save results to database
    saved_results = []
    for result in match_results:
        # Find the CV ID
        cv_id = next((cv["id"] for cv in cv_data if cv["name"] == result["cv_name"]), None)
        
        if cv_id:
            match_record = MatchResult(
                cv_id=cv_id,
                jd_id=jd.id,
                score=result.get("score", 0),
                explanation=result.get("summary", ""),
                details_json=json.dumps(result)
            )
            db.add(match_record)
            saved_results.append({
                "cv_id": cv_id,
                "cv_name": result["cv_name"],
                "score": result.get("score", 0),
                "match_level": result.get("match_level", "Unknown"),
                "key_matches": result.get("key_matches", []),
                "gaps": result.get("gaps", []),
                "summary": result.get("summary", "")
            })
    
    db.commit()
    
    return {
        "jd_id": jd.id,
        "jd_name": jd.original_name,
        "total_cvs_matched": len(saved_results),
        "results": saved_results
    }

@router.get("/history")
async def get_match_history(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recent match history."""
    matches = db.query(MatchResult).order_by(
        MatchResult.match_date.desc()
    ).limit(limit).all()
    
    results = []
    for match in matches:
        cv = db.query(Document).filter(Document.id == match.cv_id).first()
        jd = db.query(Document).filter(Document.id == match.jd_id).first()
        
        if cv and jd:
            results.append({
                "id": match.id,
                "cv_name": cv.original_name,
                "jd_name": jd.original_name,
                "score": match.score,
                "match_date": match.match_date.isoformat()
            })
    
    return {"matches": results}

@router.get("/{match_id}")
async def get_match_details(match_id: int, db: Session = Depends(get_db)):
    """Get detailed match results."""
    match = db.query(MatchResult).filter(MatchResult.id == match_id).first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    cv = db.query(Document).filter(Document.id == match.cv_id).first()
    jd = db.query(Document).filter(Document.id == match.jd_id).first()
    
    details = json.loads(match.details_json) if match.details_json else {}
    
    return {
        "id": match.id,
        "cv_name": cv.original_name if cv else "Unknown",
        "jd_name": jd.original_name if jd else "Unknown",
        "score": match.score,
        "match_date": match.match_date.isoformat(),
        "details": details
    }
