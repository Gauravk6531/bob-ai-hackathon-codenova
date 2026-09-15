"""Proportional Reporting Ratio (PRR) calculator.

Formula
-------
Given a drug X and an adverse event E over a corpus of N reports:

    a = reports containing drug X  AND event E
    b = reports containing drug X  AND NOT event E
    c = reports NOT containing X   AND event E
    d = reports NOT containing X   AND NOT event E

    PRR = (a / (a + b)) / (c / (c + d))

Interpretation
--------------
PRR represents how much more frequently event E is reported for drug X
compared to all other drugs in the same dataset.

IMPORTANT DISCLAIMER
--------------------
PRR is a *statistical association* measure.  A PRR above the signal
threshold is a **Potential Safety Signal**, NOT:
  - Confirmed adverse reaction
  - Confirmed causality
  - Proof that the drug caused the event

All signals require clinical expert review before any regulatory or
clinical decision.

Additional metrics
------------------
drug_event_proportion  = a / (a + b)   — proportion of drug-X reports with event E
comparison_proportion  = c / (c + d)   — proportion of other-drug reports with event E
chi_square             — Yates-corrected chi-square (single-df test)

Signal classification (configurable via :class:`SignalThresholds`)
------------------------------------------------------------------
Default thresholds (Evans et al. 2001 / standard pharmacovigilance):
    signal      : PRR > 2.0 AND chi-square > 4.0 AND report_count (a) >= 3
    weak_signal : PRR > 2.0 AND chi-square > 4.0 AND report_count (a) < 3
  no_signal   : everything else

Zero-denominator handling
-------------------------
When c=0 and a>0, the background reporting proportion is zero, so PRR is
undefined rather than zero. Such rows are explicitly marked as no_signal.

All functions are pure and independently testable.
"""
from __future__ import annotations

import math
from typing import NamedTuple, Optional

import pandas as pd

from .signal_config import SignalThresholds, get_signal_thresholds


# ── Data structures ────────────────────────────────────────────────────────────

class ContingencyTable(NamedTuple):
    """Four-cell contingency table for a drug/event pair.

    Attributes
    ----------
    a : reports with target drug  AND target event
    b : reports with target drug  AND other events
    c : reports with other drugs  AND target event
    d : reports with other drugs  AND other events
    """
    a: int
    b: int
    c: int
    d: int

    @property
    def total(self) -> int:
        return self.a + self.b + self.c + self.d

    @property
    def drug_reports(self) -> int:
        """Total reports mentioning the target drug (a + b)."""
        return self.a + self.b

    @property
    def event_reports(self) -> int:
        """Total reports mentioning the target event (a + c)."""
        return self.a + self.c


class PRRResult(NamedTuple):
    """Full PRR result for a single drug/event pair.

    Attributes
    ----------
    drug : normalised drug name
    adverse_event : normalised AE term
    a, b, c, d : contingency table cells
    report_count : a (reports with both drug and event)
    prr : Proportional Reporting Ratio (0.0 when not computable)
    chi_square : Yates-corrected chi-square (0.0 when not computable)
    drug_event_proportion : a / (a + b)  (0.0 when not computable)
    comparison_proportion : c / (c + d)  (0.0 when not computable)
    signal_level : "signal" | "weak_signal" | "no_signal"
    """
    drug: str
    adverse_event: str
    a: int
    b: int
    c: int
    d: int
    report_count: int
    prr: Optional[float]
    chi_square: float
    drug_event_proportion: float
    comparison_proportion: float
    signal_level: str


# ── Core calculation functions ─────────────────────────────────────────────────

def build_contingency_table(
    df: pd.DataFrame,
    drug: str,
    adverse_event: str,
) -> ContingencyTable:
    """Build the 2×2 contingency table for *drug* and *adverse_event*.

    Parameters
    ----------
    df :
        Clean FAERS DataFrame with columns ``drug_name`` and ``adverse_event``.
    drug :
        Normalised drug name (must match values in ``df['drug_name']``).
    adverse_event :
        Normalised AE term (must match values in ``df['adverse_event']``).

    Returns
    -------
    ContingencyTable with cells a, b, c, d.

    Examples
    --------
    >>> import pandas as pd
    >>> df = pd.DataFrame({
    ...     'drug_name':     ['aspirin', 'aspirin', 'ibuprofen'],
    ...     'adverse_event': ['nausea',  'headache', 'nausea'],
    ... })
    >>> t = build_contingency_table(df, 'aspirin', 'nausea')
    >>> (t.a, t.b, t.c, t.d)
    (1, 1, 1, 0)
    """
    report_ids = (
        df["report_id"] if "report_id" in df.columns else pd.Series(df.index, index=df.index)
    )
    report_flags = (
        df.assign(
            report_id=report_ids,
            has_drug=df["drug_name"].eq(drug),
            has_event=df["adverse_event"].eq(adverse_event),
        )
        .groupby("report_id", as_index=False)[["has_drug", "has_event"]]
        .any()
    )

    a = int((report_flags["has_drug"] & report_flags["has_event"]).sum())
    b = int((report_flags["has_drug"] & ~report_flags["has_event"]).sum())
    c = int((~report_flags["has_drug"] & report_flags["has_event"]).sum())
    d = int((~report_flags["has_drug"] & ~report_flags["has_event"]).sum())

    return ContingencyTable(a=a, b=b, c=c, d=d)


def compute_prr(a: int, b: int, c: int, d: int) -> tuple[Optional[float], float]:
    """Compute PRR and Yates-corrected chi-square.

    Parameters
    ----------
    a, b, c, d : contingency table cells.

    Returns
    -------
    (prr, chi_square). PRR is ``None`` when c=0 and a>0 because the
    background reporting proportion is zero. Other degenerate tables return
    0.0 for both values.

    Examples
    --------
    >>> compute_prr(10, 90, 5, 895)
    (19.9, ...)
    >>> compute_prr(0, 5, 3, 92)  # a == 0
    (0.0, 0.0)
    >>> compute_prr(5, 0, 0, 95)  # c == 0: undefined, not zero
    (None, 0.0)
    """
    if c == 0 and a > 0:
        return None, 0.0
    if a == 0 or (a + b) == 0 or (c + d) == 0:
        return 0.0, 0.0

    drug_prop = a / (a + b)
    comp_prop = c / (c + d)

    prr = drug_prop / comp_prop

    # Yates-corrected chi-square (1 degree of freedom)
    n = a + b + c + d
    if n == 0:
        return round(prr, 4), 0.0
    expected_a = ((a + b) * (a + c)) / n
    if expected_a == 0:
        chi_sq = 0.0
    else:
        chi_sq = ((max(abs(a - expected_a) - 0.5, 0.0)) ** 2) / expected_a

    return round(prr, 4), round(chi_sq, 4)


def compute_proportions(a: int, b: int, c: int, d: int) -> tuple[float, float]:
    """Return (drug_event_proportion, comparison_proportion).

    drug_event_proportion = a / (a + b)  — how often drug X reports include event E
    comparison_proportion = c / (c + d)  — how often other-drug reports include event E

    Returns (0.0, 0.0) when a denominator is zero.
    """
    drug_prop = round(a / (a + b), 6) if (a + b) > 0 else 0.0
    comp_prop = round(c / (c + d), 6) if (c + d) > 0 else 0.0
    return drug_prop, comp_prop


def classify_signal(
    prr: Optional[float],
    chi_square: float,
    report_count: int,
    thresholds: Optional[SignalThresholds] = None,
) -> str:
    """Classify a drug/event pair as "signal", "weak_signal", or "no_signal".

    Parameters
    ----------
    prr : PRR value, or None when the background proportion is zero.
    chi_square : Yates-corrected chi-square value.
    report_count : number of reports (cell *a*).
    thresholds : optional override; defaults to :func:`get_signal_thresholds`.

    Returns
    -------
    "signal"      when PRR > threshold, chi-square > threshold, and report_count >= minimum
    "weak_signal" when PRR > threshold, chi-square > threshold, and report_count < minimum
    "no_signal"   otherwise

    Examples
    --------
    >>> classify_signal(3.0, 5.0, 5)
    'signal'
    >>> classify_signal(3.0, 5.0, 2)
    'weak_signal'
    >>> classify_signal(2.0, 5.0, 5)   # PRR must be strictly greater than 2
    'no_signal'
    >>> classify_signal(3.0, 4.0, 5)   # chi-square must be strictly greater than 4
    'no_signal'
    """
    if prr is None:
        return "no_signal"
    if thresholds is None:
        thresholds = get_signal_thresholds()
    meets_statistics = (
        prr > thresholds.prr_signal_threshold
        and chi_square > thresholds.chi_square_threshold
    )
    if meets_statistics and report_count >= thresholds.min_report_count:
        return "signal"
    if meets_statistics and report_count < thresholds.min_report_count:
        return "weak_signal"
    return "no_signal"


# ── Frequency-table builder ────────────────────────────────────────────────────

def build_drug_event_frequency_table(
    df: pd.DataFrame,
    drug: str,
) -> pd.DataFrame:
    """Build drug-event frequency table for *drug*.

    Returns a DataFrame with one row per adverse event observed for *drug*,
    containing the contingency-table cells (a, b, c, d), PRR, chi_square,
    proportions, report_count, and signal_level.

    Columns
    -------
    adverse_event, a, b, c, d, report_count,
    drug_event_proportion, comparison_proportion,
    prr, chi_square, signal_level

    Parameters
    ----------
    df :
        Clean FAERS DataFrame with columns ``drug_name`` and ``adverse_event``.
    drug :
        Normalised drug name.
    """
    thresholds = get_signal_thresholds()

    drug_mask = df["drug_name"] == drug
    report_ids = df["report_id"] if "report_id" in df.columns else pd.Series(df.index, index=df.index)
    drug_ae_counts = (
        df[drug_mask].assign(report_id=report_ids[drug_mask])[["report_id", "adverse_event"]]
        .drop_duplicates()
        .groupby("adverse_event")["report_id"]
        .nunique()
        .reset_index(name="a")
    )

    rows = []
    for _, row in drug_ae_counts.iterrows():
        ae = str(row["adverse_event"])
        table = build_contingency_table(df, drug, ae)
        prr, chi_sq = compute_prr(table.a, table.b, table.c, table.d)
        drug_prop, comp_prop = compute_proportions(table.a, table.b, table.c, table.d)
        level = classify_signal(prr, chi_sq, table.a, thresholds)
        rows.append({
            "adverse_event": ae,
            "a": table.a,
            "b": table.b,
            "c": table.c,
            "d": table.d,
            "report_count": table.a,
            "drug_event_proportion": drug_prop,
            "comparison_proportion": comp_prop,
            "prr": prr,
            "chi_square": chi_sq,
            "signal_level": level,
        })

    result = pd.DataFrame(rows)
    if not result.empty:
        result = result.sort_values("prr", ascending=False).reset_index(drop=True)
    return result
