"""Signal detection API router.

IMPORTANT DISCLAIMER
--------------------
Safety signals detected here are **Potential Safety Signals** based on
statistical associations in spontaneous reporting data.  They are NOT:
  - Confirmed adverse reactions
  - Confirmed causality
  - Proof that the drug caused the event

All findings require clinical expert review before any regulatory or
clinical decision.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.models.schemas import (
    DataQuality,
    Signal,
    SignalRequest,
    SignalResponse,
    TrendPoint,
)
from backend.services.drug_normalizer import normalize_drug_name
from backend.services.faers_fetcher import fetch_faers_reports
from backend.services.faers_loader import validate_dataframe
from backend.services.prr_calculator import build_drug_event_frequency_table
from backend.services.trend_analyzer import compute_trend

router = APIRouter(tags=["Signal Detection"])

_DISCLAIMER = (
    "Safety signals represent statistical associations only. "
    "A Potential Safety Signal is NOT a confirmed adverse reaction, "
    "confirmed causality, or proof that the drug caused the event. "
    "All findings require clinical expert review."
)


@router.post("/signals", response_model=SignalResponse)
def detect_signals(request: SignalRequest) -> SignalResponse:
    """Fetch FAERS reports for a drug and compute PRR-based safety signals.

    Returns per-drug/event-pair:
    - contingency table cells (a, b, c, d)
    - PRR and chi-square
    - drug_event_proportion and comparison_proportion
    - signal classification ('signal' | 'weak_signal' | 'no_signal')
    - quarterly trend data (when dates are available)

    Data source is the downloaded processed FAERS CSV.
    """
    normalised_drug = normalize_drug_name(request.drug_name)
    if not normalised_drug:
        raise HTTPException(status_code=422, detail="drug_name is blank after normalisation")

    try:
        df, data_source = fetch_faers_reports(
            request.drug_name
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch FAERS data: {exc}")

    if df.empty:
        return SignalResponse(
            drug_name=normalised_drug,
            total_reports=0,
            data_source=data_source,
            disclaimer=_DISCLAIMER,
            signals=[],
        )

    total_reports = int(df["report_id"].nunique())
    quality_dict = validate_dataframe(df)
    data_quality = DataQuality(**quality_dict)

    # Build frequency table for the target drug
    freq_table = build_drug_event_frequency_table(df, normalised_drug)

    if freq_table.empty:
        return SignalResponse(
            drug_name=normalised_drug,
            total_reports=total_reports,
            data_source=data_source,
            disclaimer=_DISCLAIMER,
            data_quality=data_quality,
            signals=[],
        )

    signals = []
    for _, row in freq_table.iterrows():
        ae = str(row["adverse_event"])
        trend_data = compute_trend(df, normalised_drug, ae)
        trend_points = [TrendPoint(**t) for t in trend_data]

        signals.append(
            Signal(
                drug=normalised_drug,
                adverse_event=ae,
                a=int(row["a"]),
                b=int(row["b"]),
                c=int(row["c"]),
                d=int(row["d"]),
                report_count=int(row["report_count"]),
                prr=row["prr"],
                prr_status=(
                    "undefined_zero_background" if row["prr"] is None else "defined"
                ),
                chi_square=float(row["chi_square"]),
                drug_event_proportion=float(row["drug_event_proportion"]),
                comparison_proportion=float(row["comparison_proportion"]),
                signal_level=str(row["signal_level"]),
                trend=trend_points,
            )
        )

    # Already sorted by PRR desc from build_drug_event_frequency_table; cap at 50
    return SignalResponse(
        drug_name=normalised_drug,
        total_reports=total_reports,
        data_source=data_source,
        disclaimer=_DISCLAIMER,
        data_quality=data_quality,
        signals=signals[:50],
    )
