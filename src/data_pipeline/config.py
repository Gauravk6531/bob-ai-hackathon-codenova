from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    api_url: str = "https://api.fda.gov/drug/event.json"
    target_records: int = 150000
    batch_size: int = 500
    start_date: str = "2004-01-01"
    end_date: str = "2025-12-31"
    request_timeout: int = 60
    api_date_filter_enabled: bool = False
    output_directory: str = "data"
    raw_directory: str = "data/raw"
    processed_directory: str = "data/processed"
    metadata_directory: str = "data/metadata"
    dataset_path: str = "data/processed/faers_clean.csv"
    summary_path: str = "data/metadata/dataset_summary.json"


def get_settings() -> Settings:
    env = os.environ
    return Settings(
        api_url=env.get("FDA_API_URL", "https://api.fda.gov/drug/event.json"),
        target_records=int(env.get("TARGET_RECORDS", "150000")),
        batch_size=int(env.get("BATCH_SIZE", "500")),
        start_date=env.get("START_DATE", "2004-01-01"),
        end_date=env.get("END_DATE", "2025-12-31"),
        request_timeout=int(env.get("REQUEST_TIMEOUT", "60")),
        api_date_filter_enabled=env.get("API_DATE_FILTER_ENABLED", "false").lower() == "true",
        output_directory=env.get("OUTPUT_DIRECTORY", "data"),
        raw_directory=env.get("RAW_DIRECTORY", "data/raw"),
        processed_directory=env.get("PROCESSED_DIRECTORY", "data/processed"),
        metadata_directory=env.get("METADATA_DIRECTORY", "data/metadata"),
        dataset_path=env.get("DATASET_PATH", "data/processed/faers_clean.csv"),
        summary_path=env.get("SUMMARY_PATH", "data/metadata/dataset_summary.json"),
    )


def ensure_directories(base_dir: str | Path) -> None:
    root = Path(base_dir)
    for subdir in [
        root / "raw",
        root / "processed",
        root / "metadata",
    ]:
        subdir.mkdir(parents=True, exist_ok=True)
