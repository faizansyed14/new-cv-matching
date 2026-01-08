import PyPDF2
from docx import Document
from typing import Optional
import os

class DocumentParser:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extract text from PDF file."""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            return ""
    
    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extract text from DOCX file."""
        try:
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            print(f"Error extracting DOCX text: {e}")
            return ""
    
    @staticmethod
    def extract_text(file_path: str) -> str:
        """Extract text based on file extension."""
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == '.pdf':
            return DocumentParser.extract_text_from_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            return DocumentParser.extract_text_from_docx(file_path)
        else:
            return ""
    
    @staticmethod
    def validate_file(filename: str) -> bool:
        """Check if file extension is supported."""
        ext = os.path.splitext(filename)[1].lower()
        return ext in ['.pdf', '.docx', '.doc']

# Singleton instance
document_parser = DocumentParser()
