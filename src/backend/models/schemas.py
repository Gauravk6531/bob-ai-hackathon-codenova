"""Pydantic schemas for all API request/response models."""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


# ── Signal Detection ─────────────────────────────────────────────────────────

class SignalRequest(BaseModel):
    drug_name: str = Field(..., description="Drug name to analyse")
    start_year: Optional[int] = Field(None, description="Start year (YYYY)")
    end_year: Optional[int] = Field(None, description="End year (YYYY)")


class TrendPoint(BaseModel):
    quarter: str  # e.g. "2023-Q1"
    count: int


class Signal(BaseModel):
    drug: str
    adverse_event: str
    report_count: int
    prr: float
    chi_square: float
    signal_level: str  # "signal" | "weak_signal" | "no_signal"
    trend: List[TrendPoint]


class SignalResponse(BaseModel):
    drug_name: str
    total_reports: int
    signals: List[Signal]


# ── Submission Readiness ──────────────────────────────────────────────────────

class ModuleCompleteness(BaseModel):
    module: str
    title: str
    completeness_pct: float
    matched: int
    total_required: int


class GapItem(BaseModel):
    section_id: str
    module: str
    title: str
    required: bool
    priority: str  # "high" | "medium" | "low"


class ReadinessResponse(BaseModel):
    filename: str
    overall_completeness_pct: float
    module_scores: List[ModuleCompleteness]
    gaps: List[GapItem]
    matched_sections: List[str]


# ── AI Explanation ─────────────────────────────────────────────────────────────

class AIExplainRequest(BaseModel):
    mode: str = Field(..., description="'signals' or 'readiness'")
    context: str = Field(..., description="Pre-computed results as text for the AI to explain")


class AIExplainResponse(BaseModel):
    explanation: str
    disclaimer: str
    source: str  # "watsonx" | "fallback"
