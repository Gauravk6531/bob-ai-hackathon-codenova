"""FAERS data fetcher for the downloaded processed FDA dataset.

Returns a *clean* DataFrame (output of :func:`faers_loader.clean_faers_dataframe`)
with columns: report_id, drug_name, drug_name_raw, adverse_event,
adverse_event_raw, receive_date, serious.
"""
from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from .faers_loader import clean_faers_dataframe, load_csv_file

logger = logging.getLogger(__name__)

_DATASET_PATH = Path(__file__).resolve().parents[3] / "data" / "processed" / "faers_clean.csv"


def _load_csv_fallback() -> pd.DataFrame:
    """Load the downloaded processed FAERS CSV and return clean records."""
    logger.info("Loading processed FAERS CSV from %s", _DATASET_PATH)
    raw = load_csv_file(_DATASET_PATH)
    return clean_faers_dataframe(raw)


def fetch_faers_reports(drug_name: str) -> tuple[pd.DataFrame, str]:
    """Load FAERS adverse-event reports for *drug_name* from the local dataset.

    Returns
    -------
    (df, data_source) where:
    - df is a clean DataFrame ready for PRR computation
    - data_source is "faers_processed_csv"
    """
    return _load_csv_fallback().reset_index(drop=True), "faers_processed_csv"
