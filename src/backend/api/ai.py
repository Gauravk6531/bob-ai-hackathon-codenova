"""AI explanation API router."""
from __future__ import annotations

from fastapi import APIRouter
from backend.models.schemas import AIExplainRequest, AIExplainResponse
from backend.services.ai_service import get_explanation

router = APIRouter(tags=["AI Explanation"])


@router.post("/ai/explain", response_model=AIExplainResponse)
def explain(request: AIExplainRequest) -> AIExplainResponse:
    """Generate a natural-language explanation for signal or readiness results."""
    result = get_explanation(request.mode, request.context)
    return AIExplainResponse(**result)
