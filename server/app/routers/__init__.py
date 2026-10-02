from app.routers.auth_router import router as auth_router
from app.routers.analytics_router import router as analytics_router
from app.routers.revenue_router import router as revenue_router
from app.routers.integration_router import router as integration_router
from app.routers.report_router import router as report_router
from app.routers.admin_router import router as admin_router
from app.routers.tools_router import router as tools_router
from app.routers.ai_router import router as ai_router

__all__ = [
    "auth_router",
    "analytics_router",
    "revenue_router",
    "integration_router",
    "report_router",
    "admin_router",
    "tools_router",
    "ai_router"
]
