"""Trend analyzer — groups reports by quarter for a drug-event pair.

Works with the clean FAERS DataFrame (columns: drug_name, adverse_event,
receive_date) produced by :mod:`faers_loader`.

When receive_date values are not available (all NaT/None), returns an
empty list rather than raising an exception.
"""
from __future__ import annotations

from typing import Any, Dict, List

import pandas as pd


def compute_trend(
    df: pd.DataFrame,
    drug: str,
    adverse_event: str,
) -> List[Dict[str, Any]]:
    """Return quarterly report counts for a specific drug/event pair.

    Parameters
    ----------
    df :
        Clean FAERS DataFrame with columns:
        ``drug_name``, ``adverse_event``, ``receive_date``
        (receive_date values are YYYY-MM-DD strings or NaT/None).
    drug :
        Normalised drug name (exact match on ``df['drug_name']``).
    adverse_event :
        Normalised AE term (exact match on ``df['adverse_event']``).

    Returns
    -------
    List of ``{"quarter": str, "count": int}`` dicts, sorted chronologically.
    Returns ``[]`` when no matching rows exist or dates are unavailable.

    Examples
    --------
    >>> import pandas as pd
    >>> df = pd.DataFrame({
    ...     'drug_name':     ['aspirin', 'aspirin'],
    ...     'adverse_event': ['nausea',  'nausea'],
    ...     'receive_date':  ['2023-01-15', '2023-04-10'],
    ... })
    >>> compute_trend(df, 'aspirin', 'nausea')
    [{'quarter': '2023Q1', 'count': 1}, {'quarter': '2023Q2', 'count': 1}]
    """
    if df.empty:
        return []

    if "drug_name" not in df.columns or "adverse_event" not in df.columns:
        return []

    mask = (df["drug_name"] == drug) & (df["adverse_event"] == adverse_event)
    subset = df[mask].copy()

    if subset.empty:
        return []

    # Resolve receive_date — accept either YYYY-MM-DD strings or a pre-parsed column.
    if "receive_date" not in subset.columns:
        return []

    subset["_date"] = pd.to_datetime(subset["receive_date"], errors="coerce")
    subset = subset.dropna(subset=["_date"])

    if subset.empty:
        return []

    subset["_quarter"] = subset["_date"].dt.to_period("Q").astype(str)
    if "report_id" in subset.columns:
        counts = subset.groupby("_quarter")["report_id"].nunique().reset_index(name="count")
    else:
        counts = subset.groupby("_quarter").size().reset_index(name="count")
    counts = counts.sort_values("_quarter")

    return [
        {"quarter": str(row["_quarter"]), "count": int(row["count"])}
        for _, row in counts.iterrows()
    ]
