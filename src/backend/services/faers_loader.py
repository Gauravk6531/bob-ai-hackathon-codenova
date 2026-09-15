"""FAERS data loader — CSV parsing, validation, duplicate handling, missing-value handling.

Responsibilities
----------------
1. Accept a raw pandas DataFrame (from CSV or openFDA API) and return a
   clean, validated DataFrame ready for PRR computation.
2. Handle missing values, duplicates, and normalised column names.
3. Apply drug-name, adverse-event, and date normalisation.
4. Flag serious / non-serious reports where available.

This module contains pure functions that are independently testable.
"""
from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import Optional

import pandas as pd

from .drug_normalizer import normalize_drug_name, normalize_ae_term, normalize_date
from .signal_config import FaersLoaderConfig, get_faers_loader_config

logger = logging.getLogger(__name__)

# ── Column-name aliases ────────────────────────────────────────────────────────
# Maps incoming column names (lower-cased) → our canonical column names.
_COLUMN_ALIASES: dict[str, str] = {
    "safetyreportid": "report_id",
    "report_id": "report_id",
    "reportid": "report_id",
    "id": "report_id",
    "medicinalproduct": "drug_name",
    "drug_name_normalized": "drug_name",
    "drug": "drug_name",
    "drug_name": "drug_name",
    "product": "drug_name",
    "reactionmeddrapt": "adverse_event",
    "reaction_normalized": "adverse_event",
    "reaction": "adverse_event",
    "adverse_event": "adverse_event",
    "ae": "adverse_event",
    "receivedate": "receive_date",
    "receiptdate": "receive_date",
    "receive_date": "receive_date",
    "date": "receive_date",
    "serious": "serious",
}


def _rename_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalise column names using alias map (case-insensitive)."""
    rename_map: dict[str, str] = {}
    for col in df.columns:
        canonical = _COLUMN_ALIASES.get(col.strip().lower())
        if canonical and col != canonical:
            rename_map[col] = canonical
    return df.rename(columns=rename_map)


def _ensure_required_columns(df: pd.DataFrame, config: FaersLoaderConfig) -> None:
    """Raise ValueError if mandatory columns are absent after renaming."""
    required = {"report_id", "drug_name", "adverse_event"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(
            f"FAERS data is missing required columns: {sorted(missing)}. "
            f"Available columns: {list(df.columns)}"
        )


def _fill_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Handle missing values across all columns.

    Strategy:
    - report_id   : synthetic ID from row index if blank
    - drug_name   : rows with blank drug dropped (cannot compute PRR without it)
    - adverse_event: rows with blank AE dropped
    - receive_date : left as NaN (handled downstream in trend analysis)
    - serious      : filled with 'unknown'
    """
    df = df.copy()

    # Synthetic report IDs for rows that have none
    blank_id = df["report_id"].isna() | (df["report_id"].astype(str).str.strip() == "")
    if blank_id.any():
        logger.debug("Filling %d missing report_ids with synthetic IDs", blank_id.sum())
        df.loc[blank_id, "report_id"] = [f"SYNTH-{i}" for i in df.index[blank_id]]

    if "serious" not in df.columns:
        df["serious"] = "unknown"
    else:
        df["serious"] = df["serious"].fillna("unknown").astype(str).str.strip()

    if "receive_date" not in df.columns:
        df["receive_date"] = pd.NaT

    return df


def _apply_normalisation(df: pd.DataFrame) -> pd.DataFrame:
    """Apply drug-name, AE-term, and date normalisation in-place."""
    df = df.copy()
    df["drug_name_raw"] = df["drug_name"].astype(str)
    df["drug_name"] = df["drug_name_raw"].map(normalize_drug_name)

    df["adverse_event_raw"] = df["adverse_event"].astype(str)
    df["adverse_event"] = df["adverse_event_raw"].map(normalize_ae_term)

    if "receive_date" in df.columns:
        df["receive_date"] = df["receive_date"].map(normalize_date)

    return df


def _drop_invalid_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Drop rows where drug_name or adverse_event are blank after normalisation."""
    before = len(df)
    df = df.dropna(subset=["drug_name", "adverse_event"])
    df = df[
        (df["drug_name"].str.strip() != "") &
        (df["adverse_event"].str.strip() != "")
    ]
    dropped = before - len(df)
    if dropped:
        logger.debug("Dropped %d rows with blank drug_name or adverse_event", dropped)
    return df.reset_index(drop=True)


def _deduplicate(df: pd.DataFrame) -> pd.DataFrame:
    """Remove exact duplicates on (report_id, drug_name, adverse_event)."""
    before = len(df)
    df = df.drop_duplicates(subset=["report_id", "drug_name", "adverse_event"])
    dropped = before - len(df)
    if dropped:
        logger.debug("Removed %d duplicate drug-event rows", dropped)
    return df.reset_index(drop=True)


# ── Public API ─────────────────────────────────────────────────────────────────

def clean_faers_dataframe(
    raw_df: pd.DataFrame,
    config: Optional[FaersLoaderConfig] = None,
) -> pd.DataFrame:
    """Full cleaning pipeline for a raw FAERS-shaped DataFrame.

    Steps
    -----
    1. Rename / alias columns
    2. Ensure required columns exist
    3. Fill missing values
    4. Normalise drug names, AE terms, dates
    5. Drop rows with empty drug / AE after normalisation
    6. Deduplicate on (report_id, drug_name, adverse_event)
    7. Apply max_results cap

    Parameters
    ----------
    raw_df:
        DataFrame with at least 'safetyreportid'/'report_id',
        'medicinalproduct'/'drug_name', 'reactionmeddrapt'/'adverse_event'.
    config:
        Optional loader config; defaults to :func:`get_faers_loader_config`.

    Returns
    -------
    A clean DataFrame with columns:
        report_id, drug_name, drug_name_raw, adverse_event, adverse_event_raw,
        receive_date, serious
    """
    if config is None:
        config = get_faers_loader_config()

    df = _rename_columns(raw_df)
    _ensure_required_columns(df, config)
    df = _fill_missing_values(df)
    df = _apply_normalisation(df)
    df = _drop_invalid_rows(df)
    df = _deduplicate(df)

    # Cap row count
    if len(df) > config.max_results:
        logger.info("Capping FAERS data to %d rows (had %d)", config.max_results, len(df))
        df = df.head(config.max_results).reset_index(drop=True)

    logger.info(
        "clean_faers_dataframe: %d clean rows, %d unique drugs, %d unique AEs",
        len(df),
        df["drug_name"].nunique(),
        df["adverse_event"].nunique(),
    )
    return df


def parse_csv(csv_content: str) -> pd.DataFrame:
    """Parse a CSV string into a raw DataFrame.

    Parameters
    ----------
    csv_content:
        Full CSV text (with header row).

    Returns
    -------
    Raw DataFrame (no normalisation applied yet; call :func:`clean_faers_dataframe`).
    """
    try:
        df = pd.read_csv(io.StringIO(csv_content), dtype=str)
    except Exception as exc:
        raise ValueError(f"Failed to parse CSV content: {exc}") from exc
    return df


def load_csv_file(path: Path) -> pd.DataFrame:
    """Load a FAERS-format CSV file into a raw DataFrame."""
    try:
        df = pd.read_csv(path, dtype=str)
    except FileNotFoundError as exc:
        raise FileNotFoundError(f"FAERS CSV file not found: {path}") from exc
    except Exception as exc:
        raise ValueError(f"Failed to read FAERS CSV '{path}': {exc}") from exc
    return df


def validate_dataframe(df: pd.DataFrame) -> dict:
    """Return a quality-metrics dict for a *clean* FAERS DataFrame.

    The returned dict is informational only and does not modify ``df``.
    """
    if df.empty:
        return {
            "total_rows": 0,
            "unique_reports": 0,
            "unique_drugs": 0,
            "unique_adverse_events": 0,
            "unique_drug_event_pairs": 0,
            "missing_date_pct": 0.0,
            "serious_pct": 0.0,
            "date_range": {},
        }

    serious_count = (
        df["serious"].astype(str).str.strip().isin({"1", "true", "yes", "serious"}).sum()
        if "serious" in df.columns
        else 0
    )

    date_series = df["receive_date"] if "receive_date" in df.columns else pd.Series([], dtype="object")
    missing_date_pct = round(float(date_series.isna().mean() * 100), 2) if len(date_series) else 0.0
    valid_dates = date_series.dropna()
    date_range: dict = {}
    if not valid_dates.empty:
        date_range = {"min": str(valid_dates.min()), "max": str(valid_dates.max())}

    return {
        "total_rows": int(len(df)),
        "unique_reports": int(df["report_id"].nunique()) if "report_id" in df.columns else 0,
        "unique_drugs": int(df["drug_name"].nunique()) if "drug_name" in df.columns else 0,
        "unique_adverse_events": int(df["adverse_event"].nunique()) if "adverse_event" in df.columns else 0,
        "unique_drug_event_pairs": int(
            df[["drug_name", "adverse_event"]].dropna().drop_duplicates().shape[0]
        ) if {"drug_name", "adverse_event"}.issubset(df.columns) else 0,
        "missing_date_pct": missing_date_pct,
        "serious_pct": round(float(serious_count / len(df) * 100), 2) if len(df) else 0.0,
        "date_range": date_range,
    }
