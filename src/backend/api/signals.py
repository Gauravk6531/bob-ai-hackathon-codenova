"""Signal detection API router."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from backend.models.schemas import SignalRequest, SignalResponse, Signal, TrendPoint
from backend.services.faers_fetcher import fetch_faers_reports
from backend.services.drug_normalizer import normalize_drug_name, normalize_ae_term
from backend.services.prr_calculator import compute_prr, classify_signal
from backend.services.trend_analyzer import compute_trend

router = APIRouter(tags=["Signal Detection"])


@router.post("/signals", response_model=SignalResponse)
def detect_signals(request: SignalRequest) -> SignalResponse:
    """Fetch FAERS reports for a drug and compute PRR-based safety signals."""
    drug = normalize_drug_name(request.drug_name)

    try:
        df = fetch_faers_reports(request.drug_name, request.start_year, request.end_year)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch FAERS data: {exc}")

    if df.empty:
        return SignalResponse(drug_name=drug, total_reports=0, signals=[])

    total_reports = len(df)
    drug_mask = df['medicinalproduct'].str.lower().str.contains(drug, na=False)
    drug_df = df[drug_mask].copy()
    drug_df['ae_lower'] = drug_df['reactionmeddrapt'].str.lower()

    ae_counts = drug_df.groupby('ae_lower').size().reset_index(name='count')

    signals = []

    for _, row in ae_counts.iterrows():
        ae = str(row['ae_lower'])

        ae_mask = df['reactionmeddrapt'].str.lower() == ae
        a = int((drug_mask & ae_mask).sum())
        b = int((drug_mask & ~ae_mask).sum())
        c = int((~drug_mask & ae_mask).sum())
        d = int((~drug_mask & ~ae_mask).sum())

        prr, chi_sq = compute_prr(a, b, c, d)
        level = classify_signal(prr, a)

        trend_data = compute_trend(df, drug, ae)
        trend_points = [TrendPoint(**t) for t in trend_data]

        signals.append(Signal(
            drug=drug,
            adverse_event=ae,
            report_count=a,
            prr=prr,
            chi_square=chi_sq,
            signal_level=level,
            trend=trend_points,
        ))

    # Sort by PRR descending
    signals.sort(key=lambda s: s.prr, reverse=True)

    return SignalResponse(drug_name=drug, total_reports=total_reports, signals=signals[:50])
