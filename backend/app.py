from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables from .env.local in the project root
# BASE_DIR is backend/, so PROJECT_ROOT is e:/Capstone/
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(PROJECT_ROOT, ".env.local"))

from database import init_db
from routes.chat_routes import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await init_db()
    yield
    # Shutdown logic (if any)

app = FastAPI(
    title="NeuroCognizance AI Assessment API", 
    version="1.0.0",
    lifespan=lifespan
)

# Allow the frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes.prediction_routes import router as prediction_router

# Include the API routes
app.include_router(chat_router, prefix="/api")
app.include_router(prediction_router)

# Serve Static Files (e.g., LIME explanations)
static_path = os.path.join(BASE_DIR, "static")
if not os.path.exists(static_path):
    os.makedirs(static_path)
app.mount("/static", StaticFiles(directory=static_path), name="static")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "NeuroCognizance AI API"}

if __name__ == "__main__":
    import uvicorn
    # Use the PORT environment variable if available (e.g., on Render/Railway)
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
