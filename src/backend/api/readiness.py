"""Submission readiness API router."""
from __future__ import annotations

from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.models.schemas import ReadinessResponse, ModuleCompleteness, GapItem
from backend.services.doc_parser import parse_file
from backend.services.ctd_checker import check_completeness

router = APIRouter(tags=["Submission Readiness"])


@router.post("/readiness", response_model=ReadinessResponse)
async def check_readiness(file: UploadFile = File(...)) -> ReadinessResponse:
    """Upload a dossier file and check ICH CTD submission readiness."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed = ('.txt', '.pdf')
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(status_code=400, detail="Only .txt and .pdf files are supported")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50 MB limit
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    try:
        headings = parse_file(file.filename, content)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse file: {exc}")

    result = check_completeness(headings)

    return ReadinessResponse(
        filename=file.filename,
        overall_completeness_pct=result['overall_completeness_pct'],
        module_scores=[ModuleCompleteness(**m) for m in result['module_scores']],
        gaps=[GapItem(**g) for g in result['gaps']],
        matched_sections=result['matched_sections'],
    )
