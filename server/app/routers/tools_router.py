from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.auth import get_current_user
from app.models import User
from app.services.zernio_service import ZernioService

router = APIRouter(prefix="/api/v1/tools", tags=["Tools"])

class HashtagRequest(BaseModel):
    hashtag: str
    platform: Optional[str] = "instagram"

class UsernameRequest(BaseModel):
    username: str

@router.post("/hashtag-analytics")
async def analyze_hashtag(
    payload: HashtagRequest,
    current_user: User = Depends(get_current_user)
):
    return await ZernioService.analyze_hashtag(payload.hashtag, payload.platform)

@router.post("/username-availability")
async def check_username(
    payload: UsernameRequest,
    current_user: User = Depends(get_current_user)
):
    return await ZernioService.check_username_availability(payload.username)
