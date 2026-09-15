"""Drug name and MedDRA AE term normalizer."""
import re


_BRAND_SUFFIXES = re.compile(
    r'\b(hcl|hydrochloride|sodium|potassium|calcium|sulfate|phosphate|citrate|acetate|maleate|tartrate)\b',
    re.IGNORECASE,
)


def normalize_drug_name(name: str) -> str:
    """Lowercase, strip brand suffixes, collapse whitespace."""
    name = name.strip().lower()
    name = _BRAND_SUFFIXES.sub('', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name


def normalize_ae_term(term: str) -> str:
    """Lowercase and strip whitespace for MedDRA preferred terms."""
    return term.strip().lower()
