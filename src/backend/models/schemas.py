"""Pydantic schemas for all API request/response models."""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


# ── Signal Detection ─────────────────────────────────────────────────────────

class SignalRequest(BaseModel):
    drug_name: str = Field(..., description="Drug name to analyse")


class TrendPoint(BaseModel):
    quarter: str  # e.g. "2023Q1"
    count: int


class Signal(BaseModel):
    drug: str
    adverse_event: str
    # Contingency table cells
    a: int = Field(..., description="Reports: target drug AND target event")
    b: int = Field(..., description="Reports: target drug AND other events")
    c: int = Field(..., description="Reports: other drugs AND target event")
    d: int = Field(..., description="Reports: other drugs AND other events")
    report_count: int = Field(..., description="= a (reports with both drug and event)")
    # PRR metrics
    prr: Optional[float] = Field(
        ..., description="Proportional Reporting Ratio, or null when background proportion is zero"
    )
    prr_status: str = Field(..., description="defined or undefined_zero_background")
    chi_square: float = Field(..., description="Yates-corrected chi-square")
    drug_event_proportion: float = Field(
        ..., description="Proportion of drug-X reports that mention this AE: a/(a+b)"
    )
    comparison_proportion: float = Field(
        ..., description="Proportion of other-drug reports that mention this AE: c/(c+d)"
    )
    # Classification
    signal_level: str = Field(
        ...,
        description=(
            "Application-configured classification using PRR > 2, chi-square > 4, "
            "and unique report counts. Statistical associations are Potential Safety "
            "Signals, not proof of causality."
        ),
    )
    trend: List[TrendPoint]


class DataQuality(BaseModel):
    """Quality metrics for the loaded FAERS dataset."""
    total_rows: int
    unique_reports: int
    unique_drugs: int
    unique_adverse_events: int
    unique_drug_event_pairs: int
    missing_date_pct: float
    serious_pct: float
    date_range: dict


class SignalResponse(BaseModel):
    drug_name: str
    total_reports: int
    data_source: str = Field(
        ...,
        description=(
            "Origin of the underlying data: 'faers_processed_csv' "
            "(downloaded processed FDA FAERS dataset)."
        ),
    )
    disclaimer: str = Field(
        default=(
            "Safety signals represent statistical associations only. "
            "A Potential Safety Signal is NOT a confirmed adverse reaction, "
            "confirmed causality, or proof that the drug caused the event. "
            "All findings require clinical expert review."
        ),
    )
    data_quality: Optional[DataQuality] = None
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

