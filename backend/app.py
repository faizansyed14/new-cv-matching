from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import init_db
from routes import upload, database, matching

# Initialize FastAPI app
app = FastAPI(
    title="AI Hiring Tool API",
    description="Backend API for AI-based CV-JD matching system",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, you can replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(database.router)
app.include_router(matching.router)

# Startup event
@app.on_event("startup")
async def startup_event():
    # Initialize database
    init_db()
    
    # Create upload directories
    os.makedirs("uploads/cvs", exist_ok=True)
    os.makedirs("uploads/jds", exist_ok=True)
    
    print("✅ Database initialized")
    print("✅ Upload directories created")
    print("🚀 Server is ready!")

@app.get("/")
async def root():
    return {
        "message": "AI Hiring Tool API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
