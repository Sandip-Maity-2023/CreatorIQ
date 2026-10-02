from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.auth import get_current_user
from app.models import User
from app.services.ai_service import GeminiAiService

router = APIRouter(prefix="/api/v1/ai", tags=["AI Intelligence"])

class ChatRequest(BaseModel):
    prompt: str
    api_key: Optional[str] = None
    creator_context: Optional[Dict[str, Any]] = None

class PostAnalysisRequest(BaseModel):
    title: str
    platform: Optional[str] = "youtube"
    api_key: Optional[str] = None

@router.post("/chat")
async def chat_ai(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    ctx = payload.creator_context or {}
    ctx.setdefault("role", current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role))
    ctx.setdefault("email", current_user.email)
    return await GeminiAiService.chat(payload.prompt, api_key=payload.api_key, creator_context=ctx)

@router.post("/analyze-post")
async def analyze_post(
    payload: PostAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    return await GeminiAiService.analyze_post(payload.title, platform=payload.platform or "youtube", api_key=payload.api_key)
