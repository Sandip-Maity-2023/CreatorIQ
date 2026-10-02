from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.routers import (
    auth_router,
    analytics_router,
    revenue_router,
    integration_router,
    report_router,
    admin_router,
    tools_router,
    ai_router
)
from app.routers.auth_router import ensure_seed_data

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

# Run seed check
try:
    with SessionLocal() as db:
        ensure_seed_data(db)
except Exception as e:
    print(f"Seed check note: {e}")

app = FastAPI(
    title="CreatorIQ Backend Intelligence Engine",
    description="Fullstack Creator Economy API supporting YouTube, Instagram & LinkedIn integrations and RBAC governance.",
    version="2.0.0"
)

# Robust CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(revenue_router)
app.include_router(integration_router)
app.include_router(report_router)
app.include_router(admin_router)
app.include_router(tools_router)
app.include_router(ai_router)

@app.get("/")
def root():
    return {
        "app": "CreatorIQ Backend Intelligence API",
        "status": "online",
        "docs_url": "/docs",
        "supported_roles": ["Creator", "Agency", "Marketing Team", "Administrator"],
        "integrated_platforms": ["YouTube", "Instagram", "LinkedIn"]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "CreatorIQ Core API"}