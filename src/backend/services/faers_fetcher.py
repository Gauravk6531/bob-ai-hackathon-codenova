"""FAERS data fetcher — tries openFDA live API, falls back to local CSV."""
from __future__ import annotations

import os
import logging
from pathlib import Path
from typing import Optional

import httpx
import pandas as pd

logger = logging.getLogger(__name__)

_OPENFDA_BASE = "https://api.fda.gov/drug/event.json"
_CSV_PATH = Path(__file__).parent.parent / "data" / "faers_sample.csv"


def _load_csv_fallback() -> pd.DataFrame:
    """Load the bundled FAERS sample CSV as a fallback DataFrame."""
    logger.info("Loading FAERS sample CSV fallback from %s", _CSV_PATH)
    return pd.read_csv(_CSV_PATH, dtype=str)


def fetch_faers_reports(drug_name: str, start_year: Optional[int], end_year: Optional[int]) -> pd.DataFrame:
    """
    Fetch FAERS adverse event reports for the given drug.

    Tries the openFDA API first; on any failure loads the local CSV fallback.
    Returns a DataFrame with columns: safetyreportid, serious, receivedate,
    medicinalproduct, reactionmeddrapt.
    """
    try:
        return _fetch_from_openfda(drug_name, start_year, end_year)
    except Exception as exc:
        logger.warning("openFDA fetch failed (%s), using CSV fallback", exc)
        return _load_csv_fallback()


def _fetch_from_openfda(drug_name: str, start_year: Optional[int], end_year: Optional[int]) -> pd.DataFrame:
    """Call the openFDA drug/event endpoint and return a normalised DataFrame."""
    date_range = ""
    if start_year and end_year:
        date_range = f"+AND+receivedate:[{start_year}0101+TO+{end_year}1231]"

    search = f'patient.drug.medicinalproduct:"{drug_name}"{date_range}'
    params = {"search": search, "limit": 100}

    with httpx.Client(timeout=15.0) as client:
        resp = client.get(_OPENFDA_BASE, params=params)
        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", [])
    rows = []
    for r in results:
        report_id = r.get("safetyreportid", "")
        serious = r.get("serious", "")
        receive_date = r.get("receivedate", "")
        for drug in r.get("patient", {}).get("drug", []):
            med = drug.get("medicinalproduct", "")
            for reaction in r.get("patient", {}).get("reaction", []):
                ae = reaction.get("reactionmeddrapt", "")
                rows.append({
                    "safetyreportid": report_id,
                    "serious": serious,
                    "receivedate": receive_date,
                    "medicinalproduct": med,
                    "reactionmeddrapt": ae,
                })

    if not rows:
        raise ValueError("No results from openFDA — using fallback")

    return pd.DataFrame(rows)
