from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User, SocialAccount, ContentPost, RevenueRecord
from app.services.analytics_engine import AnalyticsEngine
from app.services.recommendation_engine import RecommendationEngine
from app.services.export_service import ExportService

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

def build_export_payload(current_user: User, db: Session):
    overview = AnalyticsEngine.get_overview_metrics(current_user, db)
    recs = RecommendationEngine.get_actionable_insights(current_user)

    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == current_user.id).all()
    posts = db.query(ContentPost).filter(ContentPost.user_id == current_user.id).all()
    revenues = db.query(RevenueRecord).filter(RevenueRecord.user_id == current_user.id).all()

    accounts_data = [
        {
            "platform": a.platform,
            "account_handle": a.account_handle,
            "follower_count": a.follower_count,
            "is_active": a.is_active
        }
        for a in accounts
    ]

    posts_data = [
        {
            "title": p.title,
            "platform": p.platform,
            "views": p.views,
            "likes": p.likes,
            "comments": p.comments,
            "shares": p.shares,
            "engagement_rate": p.engagement_rate
        }
        for p in posts
    ]

    revenues_data = [
        {
            "title": r.title,
            "brand_name": r.brand_name,
            "source_type": r.source_type,
            "amount": r.amount,
            "status": r.status,
            "deal_date": r.deal_date.strftime("%Y-%m-%d") if r.deal_date else "N/A"
        }
        for r in revenues
    ]

    return {
        "summary": overview.get("summary", {}),
        "growth_trend": overview.get("growth_trend", []),
        "recommendations": recs,
        "accounts": accounts_data,
        "posts": posts_data,
        "revenues": revenues_data
    }

@router.get("/export-pdf")
def export_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = build_export_payload(current_user, db)
    pdf_bytes = ExportService.generate_pdf_report(current_user, data)
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    filename = f"CreatorIQ_Report_{role_str}_{current_user.id[:6]}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/export-csv")
def export_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = build_export_payload(current_user, db)
    csv_text = ExportService.generate_csv_report(current_user, data)
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    filename = f"CreatorIQ_Metrics_{role_str}_{current_user.id[:6]}.csv"

    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
