from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from .config import Settings


def save_processed_dataset(df: pd.DataFrame, settings: Settings) -> None:
    processed_dir = Path(settings.processed_directory)
    processed_dir.mkdir(parents=True, exist_ok=True)
    dataset_path = Path(settings.dataset_path)
    dataset_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(dataset_path, index=False)


def save_summary(summary: dict, settings: Settings) -> None:
    metadata_dir = Path(settings.metadata_directory)
    metadata_dir.mkdir(parents=True, exist_ok=True)
    summary_path = Path(settings.summary_path)
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, indent=2), encoding='utf-8')
