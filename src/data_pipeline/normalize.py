from __future__ import annotations

import re
from datetime import datetime
from typing import Any


def normalize_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    text = re.sub(r"\s+", " ", text)
    return text


def normalize_upper(value: Any) -> str | None:
    text = normalize_text(value)
    if text is None:
        return None
    return text.upper()


def coerce_date(value: Any) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None
    candidates = [value]
    if re.fullmatch(r"\d{8}", value):
        candidates.append(f"{value[0:4]}-{value[4:6]}-{value[6:8]}")
    for candidate in candidates:
        try:
            parsed = datetime.strptime(candidate, "%Y-%m-%d")
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            pass
        try:
            parsed = datetime.strptime(candidate, "%Y%m%d")
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None


