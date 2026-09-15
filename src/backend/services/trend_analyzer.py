"""Trend analyzer — groups reports by quarter for a drug-event pair."""
from __future__ import annotations

from typing import List, Dict, Any
import pandas as pd


def compute_trend(df: pd.DataFrame, drug: str, ae: str) -> List[Dict[str, Any]]:
    """
    Given a FAERS-format DataFrame and a specific drug/ae pair,
    return a list of {quarter, count} sorted chronologically.
    """
    drug_lower = drug.lower()
    ae_lower = ae.lower()

    mask = (
        df['medicinalproduct'].str.lower().str.contains(drug_lower, na=False)
        & df['reactionmeddrapt'].str.lower().str.contains(ae_lower, na=False)
    )
    subset = df[mask].copy()

    if subset.empty:
        return []

    subset['receivedate'] = pd.to_datetime(subset['receivedate'], format='%Y%m%d', errors='coerce')
    subset = subset.dropna(subset=['receivedate'])  # type: ignore[call-arg]
    subset['quarter'] = subset['receivedate'].dt.to_period('Q').astype(str)

    counts = subset.groupby('quarter').size().reset_index(name='count')
    counts = counts.sort_values('quarter')

    return [{'quarter': row['quarter'], 'count': int(row['count'])} for _, row in counts.iterrows()]
