from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import requests

from .config import Settings, ensure_directories


def build_query_params(start_date: str, end_date: str, limit: int, skip: int = 0, api_date_filter_enabled: bool = False) -> dict:
    params = {'limit': limit, 'skip': skip}
    if api_date_filter_enabled and start_date and end_date:
        params['search'] = f'receivedate:[{start_date.replace("-", "")}+TO+{end_date.replace("-", "")}]'
    return params


def fetch_fda_records(settings: Settings) -> tuple[list[dict], dict]:
    ensure_directories(settings.output_directory)
    raw_dir = Path(settings.raw_directory)
    raw_dir.mkdir(parents=True, exist_ok=True)

    collected: list[dict] = []
    meta: dict[str, Any] = {
        'api_url': settings.api_url,
        'target_records': settings.target_records,
        'batch_size': settings.batch_size,
        'start_date': settings.start_date,
        'end_date': settings.end_date,
        'requested_batches': 0,
        'records_fetched': 0,
        'records_saved_raw': 0,
        'errors': [],
        'query_strategy': 'pagination_with_local_date_filter',
    }

    skip = 0
    max_pages = max(1, (settings.target_records // settings.batch_size) + 5)

    for page in range(max_pages):
        query = build_query_params(
            settings.start_date,
            settings.end_date,
            settings.batch_size,
            skip,
            api_date_filter_enabled=settings.api_date_filter_enabled,
        )
        try:
            response = requests.get(
                settings.api_url,
                params=query,
                headers={'User-Agent': 'DrugSafetySignalDetector/1.0 research data preparation'},
                timeout=settings.request_timeout,
            )
            if response.status_code >= 500:
                raise requests.HTTPError(f'{response.status_code} Server Error')
            response.raise_for_status()
            payload = response.json()
            results = payload.get('results', [])

            if not results:
                break

            filtered = []
            for entry in results:
                report_date = str(entry.get('receivedate') or '').strip()
                if report_date:
                    date_value = report_date[:4] + '-' + report_date[4:6] + '-' + report_date[6:8]
                    if date_value < settings.start_date or date_value > settings.end_date:
                        continue
                filtered.append(entry)

            for entry in filtered:
                collected.append(entry)

            raw_path = raw_dir / f'fda_raw_page_{page + 1}.json'
            raw_path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
            meta['records_saved_raw'] += 1
            meta['requested_batches'] += 1
            meta['records_fetched'] = len(collected)

            if len(collected) >= settings.target_records:
                break

            skip += settings.batch_size
            time.sleep(0.25)

        except requests.RequestException as exc:
            meta['errors'].append({'page': page + 1, 'error': str(exc)})
            break

    return collected, meta
