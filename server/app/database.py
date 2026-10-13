import os
import json
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import create_engine, Column, String, DateTime, Text, inspect, func, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger("database")

# ==============================================================================
# 1. PostgreSQL: Enterprise Relational ACID Store
# Usecase: Core business data with relational integrity & ACID guarantees:
# - Users, Passwords, RBAC Roles
# - Connected Social Accounts
# - Content Posts & Engagement aggregates
# - Revenue Records, Brand Sponsorships, Deals
# - Agency Client Rosters & Contracts
# ==============================================================================

# Priority: Use POSTGRES_URL if configured, otherwise DATABASE_URL, with SQLite fallback
pg_url = settings.POSTGRES_URL or settings.DATABASE_URL
active_sql_engine = "SQLite"

try:
    if pg_url and "postgres" in pg_url:
        engine = create_engine(pg_url, pool_pre_ping=True)
        with engine.connect() as conn:
            pass
        active_sql_engine = "PostgreSQL"
        logger.info("Connected to PostgreSQL enterprise relational engine.")
    else:
        connect_args = {"check_same_thread": False}
        engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
        active_sql_engine = "SQLite"
except Exception as e:
    logger.warning(f"Primary SQL engine connection failed ({e}). Falling back to SQLite.")
    fallback_url = "sqlite:///./creatoriq.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
    active_sql_engine = "SQLite (Fallback)"

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_postgres_overview() -> Dict[str, Any]:
    """Retrieves metadata, table names, row counts and sample records from PostgreSQL."""
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        tables_info = []

        with engine.connect() as conn:
            for t in table_names:
                count_res = conn.execute(text(f"SELECT COUNT(*) FROM {t}"))
                row_count = count_res.scalar() or 0

                columns = [col["name"] for col in inspector.get_columns(t)]
                
                # Fetch up to 5 sample rows
                sample_res = conn.execute(text(f"SELECT * FROM {t} LIMIT 5"))
                sample_rows = [dict(zip(columns, [str(v) if isinstance(v, (datetime, uuid.UUID)) else v for v in r])) for r in sample_res.fetchall()]

                tables_info.append({
                    "table_name": t,
                    "columns": columns,
                    "row_count": row_count,
                    "sample_records": sample_rows
                })

        return {
            "engine": active_sql_engine,
            "connected": True,
            "url": str(engine.url).split("@")[-1] if "@" in str(engine.url) else str(engine.url),
            "total_tables": len(table_names),
            "tables": tables_info
        }
    except Exception as e:
        logger.error(f"PostgreSQL overview fetch error: {e}")
        return {
            "engine": active_sql_engine,
            "connected": False,
            "error": str(e),
            "tables": []
        }

# ==============================================================================
# 2. SQLite 3: Dedicated Local Operational & Audit Trail Store
# Usecase: Embedded high-speed audit logging & local operational telemetry:
# - User authentication events (Login, Register, Logout)
# - Interactive RBAC role switches (tracks transitions between Creator, Agency, Admin)
# - Channel sync events & API triggers
# - PDF and CSV report export generation logs
# - Local fast operational telemetry
# ==============================================================================

sqlite_audit_path = os.path.abspath("./creatoriq_audit.db")
sqlite_engine = create_engine(f"sqlite:///{sqlite_audit_path}", connect_args={"check_same_thread": False})
AuditSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)
AuditBase = declarative_base()

class AuditLog(AuditBase):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(String, nullable=True, index=True)
    user_email = Column(String, nullable=True)
    action = Column(String, nullable=False, index=True)  # LOGIN, REGISTER, ROLE_SWITCH, CHANNEL_SYNC, REPORT_EXPORT, AI_QUERY
    status = Column(String, default="SUCCESS")
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)

# Ensure SQLite audit table exists
try:
    AuditBase.metadata.create_all(bind=sqlite_engine)
except Exception as e:
    logger.error(f"Failed to initialize SQLite audit schema: {e}")

def log_audit_event(
    action: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    status: str = "SUCCESS",
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = "127.0.0.1"
):
    """Stores an immutable audit trail entry in SQLite 3."""
    db = AuditSessionLocal()
    try:
        log_entry = AuditLog(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            user_id=user_id,
            user_email=user_email,
            action=action,
            status=status,
            details=json.dumps(details) if details else None,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error(f"SQLite audit log error: {e}")
        db.rollback()
    finally:
        db.close()

def get_sqlite_audit_logs(limit: int = 50, action: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves audit trail entries from SQLite 3 for user review."""
    db = AuditSessionLocal()
    try:
        query = db.query(AuditLog)
        if action and action != "ALL":
            query = query.filter(AuditLog.action == action)
        logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
        result = []
        for l in logs:
            parsed_details = None
            if l.details:
                try:
                    parsed_details = json.loads(l.details)
                except Exception:
                    parsed_details = l.details

            result.append({
                "id": l.id,
                "timestamp": l.timestamp.isoformat() if l.timestamp else None,
                "user_id": l.user_id,
                "user_email": l.user_email,
                "action": l.action,
                "status": l.status,
                "details": parsed_details,
                "ip_address": l.ip_address
            })
        return result
    finally:
        db.close()

def get_sqlite_stats() -> Dict[str, Any]:
    """Retrieves SQLite database storage and record statistics."""
    db = AuditSessionLocal()
    try:
        total_logs = db.query(AuditLog).count()
        file_size_bytes = os.path.getsize(sqlite_audit_path) if os.path.exists(sqlite_audit_path) else 0

        # Action breakdown
        actions_count = {}
        for action, count in db.query(AuditLog.action, func.count(AuditLog.id)).group_by(AuditLog.action).all():
            actions_count[action] = count

        return {
            "database": "SQLite 3",
            "file_path": sqlite_audit_path,
            "file_size_kb": round(file_size_bytes / 1024, 2),
            "total_audit_records": total_logs,
            "actions_breakdown": actions_count,
            "purpose": "Local Operational Store & System Audit Trails (Logins, Role Switches, Export Events, Syncs)"
        }
    finally:
        db.close()

# ==============================================================================
# 3. MongoDB: Document Store for Unstructured Big Data & Raw API Payloads
# Usecase: Schema-less JSON documents from social APIs & unstructured telemetry:
# - raw_social_payloads: Raw YouTube Data API and Instagram Graph API JSON payloads
# - viral_trends_history: Snapshots of trending videos with ranking metadata
# - hashtag_analytics_docs: Raw hashtag competition and co-occurrence graphs
# - ai_interaction_history: Raw prompt & completion interaction trees
# ==============================================================================

mongo_db = None
mongo_client = None

try:
    from pymongo import MongoClient
    if settings.MONGO_URL:
        mongo_client = MongoClient(settings.MONGO_URL, serverSelectionTimeoutMS=1000)
        mongo_db = mongo_client["creatoriq_analytics"]
        mongo_client.admin.command('ping')
        logger.info("Connected to MongoDB document store.")
except Exception as e:
    logger.warning(f"MongoDB connection skipped or offline: {e}")
    mongo_db = None

def save_raw_document(collection: str, doc: dict) -> Optional[str]:
    """Safely saves raw unstructured JSON payloads into MongoDB."""
    if mongo_db is not None:
        try:
            payload = doc.copy()
            if "saved_at" not in payload:
                payload["saved_at"] = datetime.utcnow().isoformat()
            res = mongo_db[collection].insert_one(payload)
            return str(res.inserted_id)
        except Exception as e:
            logger.debug(f"Mongo save error: {e}")
            return None
    return None

def get_mongo_collections() -> List[Dict[str, Any]]:
    """Retrieves all collections and their document counts in MongoDB."""
    if mongo_db is None:
        return []
    try:
        cols = mongo_db.list_collection_names()
        result = []
        for c in cols:
            count = mongo_db[c].count_documents({})
            result.append({
                "collection_name": c,
                "document_count": count
            })
        return result
    except Exception as e:
        logger.error(f"Error listing Mongo collections: {e}")
        return []

def get_mongo_documents(collection: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieves documents from a specific MongoDB collection."""
    if mongo_db is None:
        return []
    try:
        cursor = mongo_db[collection].find().sort("_id", -1).limit(limit)
        docs = []
        for d in cursor:
            d["_id"] = str(d["_id"])
            docs.append(d)
        return docs
    except Exception as e:
        logger.error(f"Error querying Mongo documents from {collection}: {e}")
        return []

def get_mongo_document_by_id(collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single MongoDB document by ObjectId string."""
    if mongo_db is None:
        return None
    try:
        from bson import ObjectId
        doc = mongo_db[collection].find_one({"_id": ObjectId(doc_id)})
        if doc:
            doc["_id"] = str(doc["_id"])
            return doc
        return None
    except Exception as e:
        logger.error(f"Error fetching document {doc_id}: {e}")
        return None

# ==============================================================================
# 4. Redis: High-Speed Cache & In-Memory Store
# ==============================================================================

redis_client = None
try:
    import redis
    if settings.REDIS_URL:
        redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1)
        redis_client.ping()
except Exception:
    redis_client = None

def cache_set(key: str, data: any, ttl_seconds: int = 600):
    if redis_client is not None:
        try:
            redis_client.setex(key, ttl_seconds, json.dumps(data))
        except Exception:
            pass

def cache_get(key: str):
    if redis_client is not None:
        try:
            val = redis_client.get(key)
            if val:
                return json.loads(val)
        except Exception:
            pass
    return None

# ==============================================================================
# 5. Database Status & Multi-Database Diagnostics
# ==============================================================================

def get_database_status():
    """Returns connectivity, usecase breakdown, and storage metrics for all 3 databases."""
    is_pg_online = False
    pg_details = {}
    try:
        with engine.connect() as conn:
            is_pg_online = True
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            pg_details = {
                "active_engine": active_sql_engine,
                "tables_count": len(tables),
                "tables": tables
            }
    except Exception:
        is_pg_online = False

    is_mongo_online = False
    mongo_collections_count = 0
    if mongo_db is not None:
        try:
            mongo_db.command("ping")
            is_mongo_online = True
            mongo_collections_count = len(mongo_db.list_collection_names())
        except Exception:
            is_mongo_online = False

    sqlite_stats = get_sqlite_stats()

    return {
        "postgresql": {
            "name": "PostgreSQL",
            "status": "Online & Connected" if active_sql_engine == "PostgreSQL" else "Standby (SQLite fallback active)",
            "is_connected": is_pg_online,
            "engine": active_sql_engine,
            "usecase": "Enterprise Relational ACID Database for Users, RBAC Credentials, Social Accounts, Deals, Posts, and Agency Rosters.",
            "metrics": pg_details
        },
        "mongodb": {
            "name": "MongoDB",
            "status": "Online & Connected" if is_mongo_online else "Offline",
            "is_connected": is_mongo_online,
            "usecase": "Document Store for Raw Unstructured Social API Payloads (YouTube, Instagram), Historical Viral Snapshots, and Hashtag Telemetry.",
            "collections_count": mongo_collections_count,
            "database_name": "creatoriq_analytics"
        },
        "sqlite": {
            "name": "SQLite 3",
            "status": "Active & Operational",
            "is_connected": True,
            "usecase": "Embedded Operational Store for System Audit Trails (Logins, Role Switches, Exports) and Local Diagnostics.",
            "file": sqlite_audit_path,
            "metrics": sqlite_stats
        }
    }
