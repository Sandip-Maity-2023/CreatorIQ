from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models import User, UserRole, ContentPost, SocialAccount
from app.schemas import ContentPostResponse
from app.services.analytics_engine import AnalyticsEngine
from app.services.recommendation_engine import RecommendationEngine

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("/overview")
def get_overview(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metrics = AnalyticsEngine.get_overview_metrics(current_user, db)
    return {
        "user_email": current_user.email,
        "user_role": current_user.role,
        "data": metrics
    }

from pydantic import BaseModel
from datetime import datetime
import uuid
from app.services.social_api_service import SocialApiService
from app.services.zernio_service import ZernioService

class InspectAccountRequest(BaseModel):
    handle: str
    platform: Optional[str] = "youtube"

@router.get("/content", response_model=List[ContentPostResponse])
def get_content_posts(
    platform: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ContentPost)
    if current_user.role == UserRole.CREATOR:
        query = query.filter(ContentPost.user_id == current_user.id)
    
    if platform and platform != "all":
        query = query.filter(ContentPost.platform == platform.lower())

    posts = query.order_by(ContentPost.published_at.desc()).all()
    if not posts:
        posts = db.query(ContentPost).all()
    return posts

@router.post("/content/sync")
async def sync_connected_content(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Syncs actual video uploads & social posts from all connected accounts
    using YouTube Data API v3 and Zernio Unified Social Media API.
    """
    accounts = db.query(SocialAccount).filter(SocialAccount.user_id == current_user.id).all()
    if not accounts:
        # Fallback to demo default account if none connected
        accounts = [SocialAccount(platform="youtube", account_handle="@TechInsiderDaily", user_id=current_user.id)]

    synced_count = 0
    synced_items = []

    for acc in accounts:
        plat = (acc.platform or "youtube").lower()
        if plat == "youtube":
            fetched = await SocialApiService.fetch_youtube_channel_videos(acc.account_handle, max_results=6)
        else:
            fetched = await ZernioService.fetch_account_posts(acc.account_handle, platform=plat)

        for p in fetched:
            # Check if post with same title or URL already exists
            existing = db.query(ContentPost).filter(
                ContentPost.user_id == current_user.id,
                ContentPost.title == p["title"]
            ).first()

            pub_date = datetime.utcnow()
            if isinstance(p.get("published_at"), str):
                try:
                    pub_date = datetime.fromisoformat(p["published_at"].replace("Z", "+00:00"))
                except Exception:
                    pub_date = datetime.utcnow()

            if existing:
                existing.views = p.get("views", existing.views)
                existing.likes = p.get("likes", existing.likes)
                existing.comments = p.get("comments", existing.comments)
                existing.shares = p.get("shares", existing.shares)
                existing.engagement_rate = p.get("engagement_rate", existing.engagement_rate)
            else:
                new_post = ContentPost(
                    id=str(uuid.uuid4()),
                    user_id=current_user.id,
                    platform=plat,
                    title=p["title"],
                    post_url=p.get("post_url"),
                    thumbnail_url=p.get("thumbnail_url"),
                    views=p.get("views", 0),
                    likes=p.get("likes", 0),
                    comments=p.get("comments", 0),
                    shares=p.get("shares", 0),
                    engagement_rate=p.get("engagement_rate", 0.0),
                    published_at=pub_date
                )
                db.add(new_post)
                synced_count += 1
            synced_items.append(p)

    db.commit()
    return {
        "message": f"Successfully synchronized {len(synced_items)} live posts across connected accounts.",
        "new_posts_added": synced_count,
        "total_posts": len(synced_items),
        "posts": synced_items
    }

@router.post("/content/inspect-account")
async def inspect_account_content(
    payload: InspectAccountRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Directly fetches live post-level engagement (actual views, likes, comments, shares, and engagement rate)
    for any account handle across YouTube or Zernio-supported platforms.
    """
    clean_handle = payload.handle.strip()
    plat = (payload.platform or "youtube").lower()

    if plat == "youtube":
        posts = await SocialApiService.fetch_youtube_channel_videos(clean_handle, max_results=8)
    else:
        posts = await ZernioService.fetch_account_posts(clean_handle, platform=plat)

    total_views = sum(p.get("views", 0) for p in posts)
    total_likes = sum(p.get("likes", 0) for p in posts)
    total_comments = sum(p.get("comments", 0) for p in posts)
    total_shares = sum(p.get("shares", 0) for p in posts)
    avg_eng = round(sum(p.get("engagement_rate", 0) for p in posts) / max(len(posts), 1), 2)

    return {
        "handle": clean_handle,
        "platform": plat,
        "total_posts": len(posts),
        "total_views": total_views,
        "total_likes": total_likes,
        "total_comments": total_comments,
        "total_shares": total_shares,
        "avg_engagement_rate": avg_eng,
        "posts": posts
    }


@router.get("/demographics")
def get_demographics(current_user: User = Depends(get_current_user)):
    return AnalyticsEngine.get_demographics(current_user)

@router.get("/recommendations")
def get_recommendations(current_user: User = Depends(get_current_user)):
    return RecommendationEngine.get_actionable_insights(current_user)

@router.get("/trending")
async def get_trending_content(
    category: Optional[str] = Query(None, description="Optional category: tech(28), gaming(20), music(10), entertainment(24)"),
    region: str = Query("US", description="Two-letter ISO region code"),
    current_user: User = Depends(get_current_user)
):
    from app.services.social_api_service import SocialApiService
    category_id_map = {
        "tech": "28",
        "gaming": "20",
        "music": "10",
        "entertainment": "24",
    }
    cat_id = category_id_map.get(category.lower()) if category else None
    trending = await SocialApiService.fetch_trending_videos(category_id=cat_id, region_code=region, max_results=12)
    return {
        "region": region,
        "category": category or "all",
        "total": len(trending),
        "items": trending
    }