from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from database import init_db
from routes.chat_routes import router as chat_router

app = FastAPI(title="NeuroCognizance AI Assessment API", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    await init_db()

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

# Serve Frontend Static Files (Reference only, Next.js root)
frontend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app.mount("/static", StaticFiles(directory=frontend_path), name="static")

@app.get("/")
def read_root():
    return FileResponse(os.path.join(frontend_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
