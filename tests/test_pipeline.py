from data_pipeline.config import get_settings
from data_pipeline.fetch_fda import build_query_params
from data_pipeline.normalize import coerce_date, normalize_text


def test_normalize_text_removes_extra_whitespace():
    assert normalize_text("  Acetaminophen   ") == "Acetaminophen"
    assert normalize_text("   ") is None


def test_coerce_date_handles_fda_and_iso_formats():
    assert coerce_date("20240105") == "2024-01-05"
    assert coerce_date("2024-01-05") == "2024-01-05"
    assert coerce_date("not-a-date") is None


def test_settings_load_default_values():
    settings = get_settings()
    assert settings.target_records > 0
    assert settings.batch_size > 0


def test_build_query_params_without_api_date_filter():
    params = build_query_params("2024-01-01", "2024-12-31", 100, skip=0, api_date_filter_enabled=False)
    assert params == {"limit": 100, "skip": 0}
