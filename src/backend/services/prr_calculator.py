"""Proportional Reporting Ratio (PRR) calculator.

PRR = (a / (a + b)) / (c / (c + d))

Where:
  a = reports for drug X AND event E
  b = reports for drug X AND NOT event E
  c = reports for NOT drug X AND event E
  d = reports for NOT drug X AND NOT event E

Signal thresholds (standard pharmacovigilance):
  PRR >= 2 AND report_count >= 3  => "signal"
  PRR >= 1.5 AND report_count >= 3 => "weak_signal"
  else                              => "no_signal"
"""
from __future__ import annotations

import math
from typing import Tuple


def compute_prr(a: int, b: int, c: int, d: int) -> Tuple[float, float]:
    """Return (prr, chi_square). Returns (0.0, 0.0) for degenerate tables."""
    if a == 0 or (a + b) == 0 or (c + d) == 0 or c == 0:
        return 0.0, 0.0

    prr = (a / (a + b)) / (c / (c + d))

    # Chi-square (Yates-corrected)
    n = a + b + c + d
    expected_a = ((a + b) * (a + c)) / n
    if expected_a == 0:
        chi_sq = 0.0
    else:
        chi_sq = ((abs(a - expected_a) - 0.5) ** 2) / expected_a

    return round(prr, 4), round(chi_sq, 4)


def classify_signal(prr: float, report_count: int) -> str:
    """Return signal level string."""
    if prr >= 2.0 and report_count >= 3:
        return "signal"
    if prr >= 1.5 and report_count >= 3:
        return "weak_signal"
    return "no_signal"
