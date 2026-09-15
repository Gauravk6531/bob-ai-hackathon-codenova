"""CTD section checker — matches extracted headings against ICH CTD requirements."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple

_CTD_PATH = Path(__file__).parent.parent / "data" / "ctd_requirements.json"


def _load_requirements() -> List[Dict[str, Any]]:
    with open(_CTD_PATH, encoding='utf-8') as f:
        return json.load(f)


def _heading_matches_section(heading: str, section: Dict[str, Any]) -> bool:
    """Keyword-based match: check if the heading contains the section ID or key title words."""
    heading_lower = heading.lower()
    section_id = section['id'].lower()
    title_words = [w for w in re.split(r'\W+', section['title'].lower()) if len(w) > 3]

    if section_id in heading_lower:
        return True
    # Must match at least 2 meaningful title words
    matches = sum(1 for w in title_words if w in heading_lower)
    return matches >= 2


def check_completeness(headings: List[str]) -> Dict[str, Any]:
    """
    Match extracted headings against CTD requirements.
    Returns completeness scores per module and gap report.
    """
    requirements = _load_requirements()
    matched_ids: List[str] = []

    for section in requirements:
        for heading in headings:
            if _heading_matches_section(heading, section):
                matched_ids.append(section['id'])
                break

    # Per-module scores
    modules: Dict[str, Dict[str, Any]] = {}
    for section in requirements:
        mod = section['module']
        if mod not in modules:
            modules[mod] = {'total_required': 0, 'matched': 0, 'title': mod}
        if section['required']:
            modules[mod]['total_required'] += 1
            if section['id'] in matched_ids:
                modules[mod]['matched'] += 1

    module_scores = []
    for mod, data in modules.items():
        total = data['total_required']
        pct = (data['matched'] / total * 100) if total > 0 else 0.0
        module_scores.append({
            'module': mod,
            'title': data['title'],
            'completeness_pct': round(pct, 1),
            'matched': data['matched'],
            'total_required': total,
        })

    # Overall completeness
    total_required = sum(s['total_required'] for s in module_scores)
    total_matched = sum(s['matched'] for s in module_scores)
    overall_pct = (total_matched / total_required * 100) if total_required > 0 else 0.0

    # Gaps
    gaps = []
    for section in requirements:
        if section['id'] not in matched_ids:
            priority = 'high' if section['required'] else 'low'
            gaps.append({
                'section_id': section['id'],
                'module': section['module'],
                'title': section['title'],
                'required': section['required'],
                'priority': priority,
            })

    return {
        'overall_completeness_pct': round(overall_pct, 1),
        'module_scores': module_scores,
        'gaps': gaps,
        'matched_sections': matched_ids,
    }
