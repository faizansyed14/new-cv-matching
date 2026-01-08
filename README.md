# AI-Based Hiring Tool

An intelligent CV-JD matching system powered by AI that automatically categorizes resumes and job descriptions, then matches them with detailed explanations.

## Features

- 📤 **Batch Upload**: Upload up to 60 CVs at once with drag-and-drop
- 🤖 **AI Categorization**: Automatic categorization using LLM (Software, AI, Security, Sales, etc.)
- 📁 **Smart Database**: Browse documents by category with search and filtering
- 👁️ **Document Viewer**: View PDFs directly in the browser
- ⚡ **Intelligent Matching**: Match CVs against JDs with scoring and detailed explanations
- 🎨 **Professional UI**: Modern, responsive design with glassmorphism and animations

## Tech Stack

**Backend:**
- Python 3.x
- FastAPI
- SQLAlchemy (SQLite)
- Ollama LLM (Qwen 2.5:32b)
- PyPDF2 & python-docx

**Frontend:**
- React 18
- Vite
- Axios
- React Dropzone
- Lucide Icons

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Activate virtual environment:
```bash
# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies (if not already installed):
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
python app.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Upload Documents**
   - Go to the "Upload" tab
   - Drag and drop CVs (up to 60) or click to select
   - Upload a Job Description
   - Files are automatically categorized by AI

2. **Browse Database**
   - Go to the "Database" tab
   - Browse documents by category
   - Use search to find specific documents
   - Click "View" to see document content
   - Filter by CVs or JDs

3. **Match CVs to JD**
   - Go to the "Match" tab
   - Select a Job Description from the dropdown
   - Click "Match All CVs"
   - View ranked results with scores
   - Expand results to see detailed explanations

## API Endpoints

### Upload
- `POST /api/upload/cv` - Upload CVs
- `POST /api/upload/jd` - Upload Job Description

### Database
- `GET /api/documents` - List all documents
- `GET /api/documents/categories` - Get categories
- `GET /api/documents/{id}` - Get document details
- `GET /api/documents/{id}/view` - View document file
- `DELETE /api/documents/{id}` - Delete document

### Matching
- `POST /api/match` - Match CVs to JD
- `GET /api/match/history` - Get match history
- `GET /api/match/{id}` - Get match details

## LLM Configuration

The application uses a hosted Ollama instance:
- **Host**: 51.112.105.60
- **Port**: 11434
- **Model**: qwen2.5:32b

Configuration is in `backend/llm_service.py`

## File Storage

Documents are stored in:
- `backend/uploads/cvs/{category}/`
- `backend/uploads/jds/{category}/`

Database: `backend/database.db` (SQLite)

## Supported File Formats

- PDF (.pdf)
- DOCX (.docx)

## Notes

- The LLM categorization and matching may take a few seconds per document
- Batch uploads are processed asynchronously
- PDF viewing works directly in browser
- DOCX files can be downloaded for viewing

## Troubleshooting

**Backend won't start:**
- Ensure virtual environment is activated
- Check if port 8000 is available
- Verify all dependencies are installed

**Frontend won't connect:**
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app.py`
- Verify API_BASE_URL in `frontend/src/utils/api.js`

**LLM errors:**
- Verify network connectivity to 51.112.105.60:11434
- Check if the Ollama service is running
- Increase timeout in `llm_service.py` if needed
