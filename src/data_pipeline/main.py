from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from .clean import clean_records
from .config import get_settings
from .fetch_fda import fetch_fda_records
from .save_dataset import save_processed_dataset, save_summary
from .validate import compute_quality_report


def run_pipeline() -> dict:
    settings = get_settings()
    raw_records, metadata = fetch_fda_records(settings)
    cleaned_rows = clean_records(raw_records)

    df = pd.DataFrame(cleaned_rows)
    if df.empty:
        df = pd.DataFrame(columns=[
            'report_id', 'report_date', 'receive_date', 'country', 'source',
            'patient_age', 'patient_age_unit', 'patient_sex', 'patient_weight',
            'drug_name_raw', 'drug_name_normalized', 'drug_role', 'drug_indication',
            'drug_route', 'drug_dosage', 'reaction_raw', 'reaction_normalized',
            'reaction_outcome', 'seriousness'
        ])
    else:
        df = df.dropna(subset=['drug_name_normalized', 'reaction_normalized'], how='any').copy()
        df = df.drop_duplicates().reset_index(drop=True)

    quality = compute_quality_report(df)
    summary = {
        'api_source': settings.api_url,
        'query_strategy': {
            'start_date': settings.start_date,
            'end_date': settings.end_date,
            'batch_size': settings.batch_size,
            'target_records': settings.target_records,
        },
        'raw_records_fetched': len(raw_records),
        'normalized_rows': int(len(cleaned_rows)),
        'final_rows': int(len(df)),
        'quality': quality,
        'metadata': metadata,
        'dataset_columns': list(df.columns),
    }

    save_processed_dataset(df, settings)
    save_summary(summary, settings)
    return summary


if __name__ == '__main__':
    result = run_pipeline()
    print(json.dumps(result, indent=2))
