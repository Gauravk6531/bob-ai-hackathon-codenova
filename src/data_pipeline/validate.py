from __future__ import annotations

from typing import Any

import pandas as pd


def compute_quality_report(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty:
        return {
            'total_rows': 0,
            'unique_reports': 0,
            'unique_drugs': 0,
            'unique_reactions': 0,
            'unique_drug_event_pairs': 0,
            'missing_drug_pct': 0.0,
            'missing_reaction_pct': 0.0,
            'date_range': {},
            'duplicate_rows': 0,
        }

    report = {
        'total_rows': int(len(df)),
        'unique_reports': int(df['report_id'].nunique()) if 'report_id' in df.columns else 0,
        'unique_drugs': int(df['drug_name_normalized'].nunique()) if 'drug_name_normalized' in df.columns else 0,
        'unique_reactions': int(df['reaction_normalized'].nunique()) if 'reaction_normalized' in df.columns else 0,
        'unique_drug_event_pairs': int(df[['drug_name_normalized', 'reaction_normalized']].dropna().drop_duplicates().shape[0]) if {'drug_name_normalized', 'reaction_normalized'}.issubset(df.columns) else 0,
        'missing_drug_pct': round(float(df['drug_name_normalized'].isna().mean() * 100), 2) if 'drug_name_normalized' in df.columns else 0.0,
        'missing_reaction_pct': round(float(df['reaction_normalized'].isna().mean() * 100), 2) if 'reaction_normalized' in df.columns else 0.0,
        'date_range': {},
        'duplicate_rows': int(df.duplicated().sum()),
    }

    if 'report_date' in df.columns:
        valid_dates = df['report_date'].dropna()
        if not valid_dates.empty:
            report['date_range'] = {
                'min': str(valid_dates.min()),
                'max': str(valid_dates.max()),
            }

    return report
