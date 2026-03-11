from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import router
from api.auth_endpoints import router as auth_router
from api.playlist_endpoints import router as playlist_router
from api.analytics_endpoints import router as analytics_router
from utils.database import init_db
import os

app = FastAPI(title="Music Tool API", version="2.0.0")

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()
    print("✓ Database initialized")

# Configure CORS origins
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
default_origins = [
    "http://localhost:8081",
    "http://192.168.2.155:8081",
    "http://localhost:3000",
]

# Add production origins from environment variable
if allowed_origins_env:
    production_origins = [origin.strip() for origin in allowed_origins_env.split(",")]
    allowed_origins = default_origins + production_origins
else:
    allowed_origins = default_origins

# Enable CORS for web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint for Render
@app.get("/")
def health_check():
    """Simple health check endpoint"""
    return {
        "status": "ok",
        "message": "Music Tool API is running",
        "version": "2.0.0"
    }

# Include routers
app.include_router(auth_router)      # Authentication endpoints (/auth/*)
app.include_router(playlist_router)  # Playlist endpoints (/playlists/*)
app.include_router(analytics_router) # Analytics endpoints (/analytics/*)
app.include_router(router)           # Existing music endpoints