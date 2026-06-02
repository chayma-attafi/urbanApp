import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.middleware import RateLimitMiddleware, SecurityHeadersMiddleware
from app.database import Base, engine
from app.routers import auth, demo, profile, routing, transport

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, version="0.1.0")

os.makedirs("static/avatars", exist_ok=True)

app.add_middleware(RateLimitMiddleware, max_requests=120, window_seconds=60)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(transport.router, prefix="/api/transport", tags=["transport"])
app.include_router(routing.router, prefix="/api/routing", tags=["routing"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def root():
    return {"name": settings.APP_NAME, "status": "online"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
