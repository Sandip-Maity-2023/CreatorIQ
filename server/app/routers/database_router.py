from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from app.auth import get_current_user
from app.models import User
from app.database import (
    get_database_status,
    get_postgres_overview,
    get_mongo_collections,
    get_mongo_documents,
    get_mongo_document_by_id,
    get_sqlite_audit_logs,
    get_sqlite_stats,
    save_raw_document,
    log_audit_event,
    engine
)

router = APIRouter(prefix="/api/v1/database", tags=["Multi-Database Management"])

@router.get("/status")
def get_db_status(current_user: User = Depends(get_current_user)):
    """Returns connectivity, usecase breakdown, and storage metrics for all 3 databases."""
    return get_database_status()

# -----------------------------------------------------------------------------
# 1. PostgreSQL Endpoints (Relational Core Business Data)
# -----------------------------------------------------------------------------

@router.get("/postgresql/overview")
def get_pg_overview(current_user: User = Depends(get_current_user)):
    """Retrieves all tables, column definitions, row counts, and sample rows from PostgreSQL."""
    return get_postgres_overview()

@router.get("/postgresql/table/{table_name}")
def get_pg_table_data(
    table_name: str,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user)
):
    """Retrieves rows from a specific PostgreSQL table."""
    from sqlalchemy import text
    allowed_tables = ["users", "social_accounts", "content_posts", "revenue_records", "agency_clients"]
    if table_name not in allowed_tables:
        raise HTTPException(status_code=400, detail=f"Invalid table name. Allowed tables: {', '.join(allowed_tables)}")

    try:
        with engine.connect() as conn:
            res = conn.execute(text(f"SELECT * FROM {table_name} LIMIT :limit"), {"limit": limit})
            columns = res.keys()
            rows = [dict(zip(columns, [str(v) if hasattr(v, "isoformat") else v for v in r])) for r in res.fetchall()]
            return {
                "table_name": table_name,
                "total_returned": len(rows),
                "columns": list(columns),
                "rows": rows
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query error: {str(e)}")

# -----------------------------------------------------------------------------
# 2. MongoDB Endpoints (Unstructured Document Store)
# -----------------------------------------------------------------------------

@router.get("/mongodb/collections")
def list_mongo_collections(current_user: User = Depends(get_current_user)):
    """Retrieves all MongoDB collections and their document counts."""
    return {
        "collections": get_mongo_collections()
    }

@router.get("/mongodb/documents")
def get_mongo_collection_documents(
    collection: str = Query("raw_social_payloads", description="Collection name"),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Retrieves recent JSON documents stored in a MongoDB collection."""
    docs = get_mongo_documents(collection, limit=limit)
    return {
        "collection": collection,
        "count": len(docs),
        "documents": docs
    }

@router.get("/mongodb/documents/{doc_id}")
def get_single_mongo_document(
    doc_id: str,
    collection: str = Query("raw_social_payloads"),
    current_user: User = Depends(get_current_user)
):
    """Retrieves a single MongoDB document by ObjectId string."""
    doc = get_mongo_document_by_id(collection, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

# -----------------------------------------------------------------------------
# 3. SQLite 3 Endpoints (Audit Trail & Telemetry Store)
# -----------------------------------------------------------------------------

@router.get("/sqlite/audit-logs")
def get_audit_trail(
    action: Optional[str] = Query("ALL", description="Filter by action (e.g. ROLE_SWITCH, LOGIN, CHANNEL_SYNC)"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user)
):
    """Retrieves immutable audit trail entries stored in SQLite 3."""
    logs = get_sqlite_audit_logs(limit=limit, action=action if action != "ALL" else None)
    return {
        "database": "SQLite 3 (creatoriq_audit.db)",
        "total_returned": len(logs),
        "logs": logs
    }

@router.get("/sqlite/stats")
def get_sqlite_telemetry_stats(current_user: User = Depends(get_current_user)):
    """Retrieves operational storage and action counts from SQLite 3."""
    return get_sqlite_stats()

