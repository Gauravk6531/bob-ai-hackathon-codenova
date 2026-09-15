"""Drug-name, adverse-event term, and date normaliser.

All functions are pure (no side-effects) and independently testable.

Drug-name normalisation
-----------------------
1. Strip whitespace and lower-case.
2. Remove salt/ester suffixes that vary across data sources
   (e.g. "metformin hydrochloride" → "metformin").
3. Collapse multiple spaces to a single space.

Adverse-event normalisation
---------------------------
1. Strip whitespace and lower-case (MedDRA preferred terms are already
   standardised; we just normalise casing and whitespace).

Date normalisation
------------------
Accepts YYYYMMDD or YYYY-MM-DD → returns YYYY-MM-DD (ISO 8601) or None.
Returns a pd.Timestamp-compatible string so downstream trend analysis can
call pd.to_datetime on it.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Optional


# ── Drug-name normalisation ────────────────────────────────────────────────────

# Salt/ester/counter-ion suffixes that do not distinguish the active moiety.
_SALT_SUFFIXES = re.compile(
    r"\b("
    r"hcl|hydrochloride|hydrobromide|hydriodide"
    r"|sodium|potassium|calcium|magnesium|aluminium|aluminum|zinc"
    r"|sulfate|sulphate|phosphate|bisphosphate|diphosphate"
    r"|citrate|tartrate|maleate|fumarate|succinate|oxalate"
    r"|acetate|propionate|butyrate|benzoate|salicylate"
    r"|mesylate|mesilate|tosylate|besylate|besilate"
    r"|nitrate|nitrite|chloride|bromide|iodide|fluoride"
    r"|gluconate|lactate|malate|aspartate|glutamate"
    r"|monohydrate|dihydrate|trihydrate|anhydrous"
    r"|hemihydrate|sesquihydrate"
    r")\b",
    re.IGNORECASE,
)

# Dose-form or route suffixes sometimes appended to drug names in FAERS.
_DOSE_FORM_SUFFIXES = re.compile(
    r"\b("
    r"tablet|tablets|capsule|capsules|injection|injectable"
    r"|oral|solution|suspension|patch|cream|ointment|gel|spray"
    r"|extended.release|sustained.release|immediate.release"
    r"|er|sr|xr|xl|cr|la|mr"
    r")\b",
    re.IGNORECASE,
)

# Trailing punctuation / digits that are artefacts (e.g. "aspirin 81mg")
_TRAILING_DOSE = re.compile(r"\s+\d[\d.,]*\s*(mg|mcg|g|iu|ml|l|mmol)\b.*$", re.IGNORECASE)


def normalize_drug_name(name: Any) -> Optional[str]:
    """Return a canonical lower-case drug name, or None if blank.

    Examples
    --------
    >>> normalize_drug_name("METFORMIN HYDROCHLORIDE")
    'metformin'
    >>> normalize_drug_name("  Aspirin 81mg  ")
    'aspirin'
    >>> normalize_drug_name("Warfarin Sodium")
    'warfarin'
    >>> normalize_drug_name("")
    None
    """
    if name is None:
        return None
    text = str(name).strip()
    if not text:
        return None

    text = _TRAILING_DOSE.sub("", text)
    text = _SALT_SUFFIXES.sub("", text)
    text = _DOSE_FORM_SUFFIXES.sub("", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    # After stripping suffixes the name may be empty (e.g. input was "hcl")
    return text if text else None


# ── Adverse-event term normalisation ──────────────────────────────────────────

def normalize_ae_term(term: Any) -> Optional[str]:
    """Return a lower-cased, whitespace-collapsed AE preferred term, or None.

    MedDRA preferred terms are already standardised; we normalise only
    casing and extraneous whitespace.

    Examples
    --------
    >>> normalize_ae_term("GASTROINTESTINAL HAEMORRHAGE")
    'gastrointestinal haemorrhage'
    >>> normalize_ae_term("  Myocardial Infarction  ")
    'myocardial infarction'
    >>> normalize_ae_term(None)
    None
    """
    if term is None:
        return None
    text = str(term).strip()
    if not text:
        return None
    return re.sub(r"\s+", " ", text).strip().lower()


# ── Date normalisation ────────────────────────────────────────────────────────

_YYYYMMDD = re.compile(r"^\d{8}$")
_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def normalize_date(value: Any) -> Optional[str]:
    """Parse FAERS date formats and return YYYY-MM-DD string, or None.

    Accepts:
    - "20230115"  → "2023-01-15"
    - "2023-01-15" → "2023-01-15"
    - Anything else → None

    Examples
    --------
    >>> normalize_date("20230115")
    '2023-01-15'
    >>> normalize_date("2023-01-15")
    '2023-01-15'
    >>> normalize_date("notadate")
    None
    >>> normalize_date(None)
    None
    """
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "nat", ""}:
        return None

    if _ISO_DATE.match(text):
        year, month, day = text.split("-")
        # Basic range validation
        if 1 <= int(month) <= 12 and 1 <= int(day) <= 31:
            return text
        return None

    if _YYYYMMDD.match(text):
        year, month, day = text[:4], text[4:6], text[6:8]
        if 1 <= int(month) <= 12 and 1 <= int(day) <= 31:
            return f"{year}-{month}-{day}"
        return None

    for date_format in ("%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(text, date_format).strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None
