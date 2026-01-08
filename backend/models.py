from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)
    original_name = Column(String)
    file_type = Column(String)  # 'cv' or 'jd'
    category = Column(String, index=True)  # Software, AI, Security, Sales, etc.
    upload_date = Column(DateTime, default=datetime.utcnow)
    file_path = Column(String)
    file_size = Column(Integer)
    text_content = Column(Text)  # Extracted text for matching

class MatchResult(Base):
    __tablename__ = "match_results"
    
    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, index=True)
    jd_id = Column(Integer, index=True)
    score = Column(Float)
    explanation = Column(Text)
    match_date = Column(DateTime, default=datetime.utcnow)
    details_json = Column(Text)  # JSON string with detailed breakdown
