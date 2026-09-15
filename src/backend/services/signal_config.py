"""Configurable thresholds and settings for the Signal Detection engine.

All signal classification thresholds are centralised here so they can be
changed in one place without touching calculation logic.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List


@dataclass(frozen=True)
class SignalThresholds:
    """Application-configured PRR and chi-square signal thresholds.

    Standard pharmacovigilance thresholds (Evans et al. 2001):
    signal      : PRR > 2.0 AND chi-square > 4.0 AND report_count >= 3
    weak_signal : PRR > 2.0 AND chi-square > 4.0 AND report_count < 3
      no_signal   : everything else

    Change via environment variables:
      SIGNAL_PRR_THRESHOLD       (default 2.0)
    SIGNAL_CHI_SQUARE_THRESHOLD (default 4.0)
      MIN_REPORT_COUNT           (default 3)
    """
    prr_signal_threshold: float = 2.0
    chi_square_threshold: float = 4.0
    min_report_count: int = 3


@dataclass(frozen=True)
class FaersLoaderConfig:
    """Configuration for FAERS CSV loading and cleaning.

    Required CSV columns (case-insensitive aliases accepted):
        safetyreportid  – unique report identifier
        serious         – 1 = serious, 0 = non-serious (optional)
        receivedate     – YYYYMMDD or YYYY-MM-DD
        medicinalproduct – drug name
        reactionmeddrapt – MedDRA preferred adverse-event term

    Change via environment variables:
        FAERS_MAX_RESULTS  (default 10 000)
    """
    required_columns: List[str] = field(default_factory=lambda: [
        "safetyreportid",
        "medicinalproduct",
        "reactionmeddrapt",
    ])
    optional_columns: List[str] = field(default_factory=lambda: [
        "serious",
        "receivedate",
    ])
    max_results: int = 10_000
    # Columns treated as the report's unique key for duplicate detection
    dedup_key: List[str] = field(default_factory=lambda: [
        "safetyreportid",
        "medicinalproduct",
        "reactionmeddrapt",
    ])


def get_signal_thresholds() -> SignalThresholds:
    """Return thresholds, overrideable via environment variables."""
    return SignalThresholds(
        prr_signal_threshold=float(
            os.environ.get("SIGNAL_PRR_THRESHOLD", "2.0")
        ),
        chi_square_threshold=float(
            os.environ.get("SIGNAL_CHI_SQUARE_THRESHOLD", "4.0")
        ),
        min_report_count=int(os.environ.get("MIN_REPORT_COUNT", "3")),
    )


def get_faers_loader_config() -> FaersLoaderConfig:
    """Return FAERS loader config, overrideable via environment variables."""
    return FaersLoaderConfig(
        max_results=int(os.environ.get("FAERS_MAX_RESULTS", "10000")),
    )
