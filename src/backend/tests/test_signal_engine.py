"""Unit tests for the Drug Safety Signal Detection engine.

Tests cover:
- Drug-name normalisation
- AE-term normalisation
- Date normalisation
- Contingency-table construction
- PRR calculation (including zero-denominator safety)
- Signal classification (with configurable thresholds)
- Drug-event proportion calculation
- FAERS DataFrame cleaning (missing values, duplicates, column aliases)
- Data quality validation
- Trend computation

All tests use deterministic, synthetic data — NOT real patient data.
"""
import io
import sys
import os

# Ensure src/ is on sys.path so that "backend.*" imports resolve.
_SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

import pandas as pd
import pytest

from backend.services.drug_normalizer import normalize_drug_name, normalize_ae_term, normalize_date
from backend.services.prr_calculator import (
    build_contingency_table,
    compute_prr,
    compute_proportions,
    classify_signal,
    build_drug_event_frequency_table,
    ContingencyTable,
)
from backend.services.signal_config import SignalThresholds, get_signal_thresholds
from backend.services.faers_loader import (
    clean_faers_dataframe,
    parse_csv,
    validate_dataframe,
    _rename_columns,
    _deduplicate,
    _fill_missing_values,
)
from backend.services.trend_analyzer import compute_trend


# ── Helpers ────────────────────────────────────────────────────────────────────

def _make_df(**cols):
    """Build a minimal clean FAERS DataFrame from keyword args."""
    return pd.DataFrame(cols)


# ─────────────────────────────────────────────────────────────────────────────
# Drug-name normalisation
# ─────────────────────────────────────────────────────────────────────────────

class TestNormalizeDrugName:
    def test_lowercase(self):
        assert normalize_drug_name("ASPIRIN") == "aspirin"

    def test_strips_hydrochloride(self):
        assert normalize_drug_name("METFORMIN HYDROCHLORIDE") == "metformin"

    def test_strips_hcl(self):
        assert normalize_drug_name("metformin hcl") == "metformin"

    def test_strips_sodium(self):
        assert normalize_drug_name("Warfarin Sodium") == "warfarin"

    def test_strips_dose(self):
        # "aspirin 81mg" → "aspirin"
        result = normalize_drug_name("Aspirin 81mg")
        assert result == "aspirin"

    def test_collapses_whitespace(self):
        assert normalize_drug_name("  metformin   ") == "metformin"

    def test_none_input(self):
        assert normalize_drug_name(None) is None

    def test_empty_string(self):
        assert normalize_drug_name("") is None

    def test_only_salt_returns_none(self):
        # "hcl" alone → stripped → empty → None
        assert normalize_drug_name("HCL") is None

    def test_preserves_multi_word(self):
        result = normalize_drug_name("amoxicillin clavulanate")
        assert result is not None
        assert "amoxicillin" in result


# ─────────────────────────────────────────────────────────────────────────────
# AE-term normalisation
# ─────────────────────────────────────────────────────────────────────────────

class TestNormalizeAeTerm:
    def test_lowercase(self):
        assert normalize_ae_term("GASTROINTESTINAL HAEMORRHAGE") == "gastrointestinal haemorrhage"

    def test_strips_whitespace(self):
        assert normalize_ae_term("  Myocardial Infarction  ") == "myocardial infarction"

    def test_collapses_internal_whitespace(self):
        assert normalize_ae_term("renal  failure") == "renal failure"

    def test_none_input(self):
        assert normalize_ae_term(None) is None

    def test_empty_string(self):
        assert normalize_ae_term("") is None


# ─────────────────────────────────────────────────────────────────────────────
# Date normalisation
# ─────────────────────────────────────────────────────────────────────────────

class TestNormalizeDate:
    def test_yyyymmdd_format(self):
        assert normalize_date("20230115") == "2023-01-15"

    def test_iso_format(self):
        assert normalize_date("2023-01-15") == "2023-01-15"

    def test_day_month_year_format(self):
        assert normalize_date("07-07-2008") == "2008-07-07"

    def test_invalid_returns_none(self):
        assert normalize_date("not-a-date") is None

    def test_none_returns_none(self):
        assert normalize_date(None) is None

    def test_empty_returns_none(self):
        assert normalize_date("") is None

    def test_nan_string_returns_none(self):
        assert normalize_date("NaN") is None

    def test_invalid_month_returns_none(self):
        assert normalize_date("20231399") is None  # month 13

    def test_invalid_day_returns_none(self):
        assert normalize_date("20231200") is None  # day 00


# ─────────────────────────────────────────────────────────────────────────────
# Contingency table construction
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildContingencyTable:
    @pytest.fixture
    def small_df(self):
        return pd.DataFrame({
            "drug_name":     ["aspirin", "aspirin", "ibuprofen", "ibuprofen"],
            "adverse_event": ["nausea",  "headache", "nausea",    "headache"],
        })

    def test_cell_a(self, small_df):
        t = build_contingency_table(small_df, "aspirin", "nausea")
        assert t.a == 1  # aspirin + nausea

    def test_cell_b(self, small_df):
        t = build_contingency_table(small_df, "aspirin", "nausea")
        assert t.b == 1  # aspirin + headache (other event)

    def test_cell_c(self, small_df):
        t = build_contingency_table(small_df, "aspirin", "nausea")
        assert t.c == 1  # ibuprofen + nausea (other drug + target event)

    def test_cell_d(self, small_df):
        t = build_contingency_table(small_df, "aspirin", "nausea")
        assert t.d == 1  # ibuprofen + headache

    def test_total(self, small_df):
        t = build_contingency_table(small_df, "aspirin", "nausea")
        assert t.total == 4

    def test_missing_drug_returns_zero_a(self, small_df):
        t = build_contingency_table(small_df, "warfarin", "nausea")
        assert t.a == 0
        assert t.b == 0

    def test_is_named_tuple(self, small_df):
        t = build_contingency_table(small_df, "aspirin", "nausea")
        assert isinstance(t, ContingencyTable)


# ─────────────────────────────────────────────────────────────────────────────
# PRR calculation
# ─────────────────────────────────────────────────────────────────────────────

class TestComputePRR:
    def test_basic_prr(self):
        # a=10, b=90: drug_prop = 0.1; c=5, d=895: comp_prop ~= 0.00556 → PRR ≈ 18.0
        prr, _ = compute_prr(10, 90, 5, 895)
        assert prr > 1.0  # significantly elevated

    def test_prr_is_1_when_proportions_equal(self):
        # a=50, b=50 → drug_prop=0.5; c=50, d=50 → comp_prop=0.5
        prr, _ = compute_prr(50, 50, 50, 50)
        assert prr == pytest.approx(1.0, abs=0.01)

    def test_zero_a_returns_zero(self):
        assert compute_prr(0, 10, 5, 85) == (0.0, 0.0)

    def test_zero_c_returns_undefined(self):
        assert compute_prr(5, 10, 0, 85) == (None, 0.0)

    def test_zero_drug_total_returns_zero(self):
        assert compute_prr(0, 0, 5, 85) == (0.0, 0.0)

    def test_zero_other_drug_total_returns_zero(self):
        assert compute_prr(5, 10, 0, 0) == (None, 0.0)

    def test_prr_is_deterministic(self):
        """Same inputs always produce same output."""
        result1 = compute_prr(10, 90, 5, 895)
        result2 = compute_prr(10, 90, 5, 895)
        assert result1 == result2

    def test_returns_two_floats(self):
        prr, chi = compute_prr(5, 5, 5, 85)
        assert isinstance(prr, float)
        assert isinstance(chi, float)


# ─────────────────────────────────────────────────────────────────────────────
# Proportions
# ─────────────────────────────────────────────────────────────────────────────

class TestComputeProportions:
    def test_drug_proportion(self):
        drug_p, _ = compute_proportions(10, 90, 5, 895)
        assert drug_p == pytest.approx(0.10, abs=0.001)

    def test_comparison_proportion(self):
        _, comp_p = compute_proportions(10, 90, 5, 895)
        assert comp_p == pytest.approx(5 / 900, abs=0.0001)

    def test_zero_drug_total_returns_zero_proportion(self):
        drug_p, _ = compute_proportions(0, 0, 5, 95)
        assert drug_p == 0.0

    def test_zero_other_drug_total_returns_zero_comparison(self):
        _, comp_p = compute_proportions(5, 95, 0, 0)
        assert comp_p == 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Signal classification
# ─────────────────────────────────────────────────────────────────────────────

class TestClassifySignal:
    def test_signal_level(self):
        assert classify_signal(3.0, 5.0, 5) == "signal"

    def test_weak_signal_level(self):
        assert classify_signal(3.0, 5.0, 2) == "weak_signal"

    def test_no_signal_low_prr(self):
        assert classify_signal(2.0, 5.0, 10) == "no_signal"

    def test_no_signal_at_chi_square_boundary(self):
        assert classify_signal(3.0, 4.0, 10) == "no_signal"

    def test_no_signal_too_few_reports(self):
        assert classify_signal(1.0, 5.0, 2) == "no_signal"

    def test_exactly_at_signal_threshold(self):
        assert classify_signal(2.0, 5.0, 3) == "no_signal"

    def test_custom_thresholds(self):
        custom = SignalThresholds(
            prr_signal_threshold=3.0,
            chi_square_threshold=4.0,
            min_report_count=5,
        )
        assert classify_signal(3.5, 5.0, 6, custom) == "signal"
        assert classify_signal(3.5, 5.0, 3, custom) == "weak_signal"
        assert classify_signal(2.5, 5.0, 6, custom) == "no_signal"

    def test_zero_prr_is_no_signal(self):
        assert classify_signal(0.0, 5.0, 100) == "no_signal"


# ─────────────────────────────────────────────────────────────────────────────
# Frequency table
# ─────────────────────────────────────────────────────────────────────────────

class TestBuildFrequencyTable:
    @pytest.fixture
    def df(self):
        return pd.DataFrame({
            "drug_name": [
                "aspirin", "aspirin", "aspirin",
                "ibuprofen", "ibuprofen",
                "warfarin",
            ],
            "adverse_event": [
                "haemorrhage", "haemorrhage", "nausea",
                "haemorrhage", "nausea",
                "haemorrhage",
            ],
        })

    def test_returns_dataframe(self, df):
        result = build_drug_event_frequency_table(df, "aspirin")
        assert isinstance(result, pd.DataFrame)

    def test_has_expected_columns(self, df):
        result = build_drug_event_frequency_table(df, "aspirin")
        for col in ("adverse_event", "a", "b", "c", "d", "prr", "signal_level"):
            assert col in result.columns, f"Missing column: {col}"

    def test_sorted_by_prr_descending(self, df):
        result = build_drug_event_frequency_table(df, "aspirin")
        prrs = result["prr"].tolist()
        assert prrs == sorted(prrs, reverse=True)

    def test_unknown_drug_returns_empty(self, df):
        result = build_drug_event_frequency_table(df, "unknowndrug")
        assert result.empty

    def test_report_count_equals_a(self, df):
        result = build_drug_event_frequency_table(df, "aspirin")
        for _, row in result.iterrows():
            assert row["report_count"] == row["a"]

    def test_report_counts_use_unique_report_ids(self):
        df = pd.DataFrame({
            "report_id": ["r1", "r1", "r2", "r3"],
            "drug_name": ["aspirin", "aspirin", "ibuprofen", "ibuprofen"],
            "adverse_event": ["nausea", "headache", "nausea", "headache"],
        })
        result = build_drug_event_frequency_table(df, "aspirin")
        nausea = result.loc[result["adverse_event"] == "nausea"].iloc[0]
        assert (nausea["a"], nausea["b"], nausea["c"], nausea["d"]) == (1, 0, 1, 1)


# ─────────────────────────────────────────────────────────────────────────────
# FAERS DataFrame cleaning
# ─────────────────────────────────────────────────────────────────────────────

class TestCleanFaersDataframe:
    @pytest.fixture
    def raw_df(self):
        # Row 3 is an exact duplicate of row 0 (same report_id + drug + AE)
        return pd.DataFrame({
            "safetyreportid":  ["R001", "R002", "R001", "R001"],
            "medicinalproduct": ["ASPIRIN", "IBUPROFEN", "ASPIRIN", "ASPIRIN"],
            "reactionmeddrapt": ["NAUSEA", "HEADACHE", "NAUSEA", "NAUSEA"],
            "serious":          ["1", "0", "1", "1"],
            "receivedate":      ["20230101", "20230201", "20230101", "20230101"],
        })

    def test_clean_returns_dataframe(self, raw_df):
        df = clean_faers_dataframe(raw_df)
        assert isinstance(df, pd.DataFrame)

    def test_columns_renamed(self, raw_df):
        df = clean_faers_dataframe(raw_df)
        assert "drug_name" in df.columns
        assert "adverse_event" in df.columns
        assert "report_id" in df.columns

    def test_deduplication(self, raw_df):
        df = clean_faers_dataframe(raw_df)
        # R001/aspirin/nausea appears 3 times (rows 0, 2, 3) → dedup to 1
        # R002/ibuprofen/headache appears once → remains
        assert len(df) == 2
        aspirin_nausea = df[
            (df["drug_name"] == "aspirin") & (df["adverse_event"] == "nausea")
        ]
        assert len(aspirin_nausea) == 1

    def test_drug_name_normalised(self, raw_df):
        df = clean_faers_dataframe(raw_df)
        assert all(df["drug_name"].str.islower())

    def test_ae_normalised(self, raw_df):
        df = clean_faers_dataframe(raw_df)
        assert all(df["adverse_event"].str.islower())

    def test_date_normalised(self, raw_df):
        df = clean_faers_dataframe(raw_df)
        # Dates in receive_date should be YYYY-MM-DD or None
        valid = df["receive_date"].dropna()
        for d in valid:
            assert len(d) == 10, f"unexpected date format: {d}"
            assert d[4] == "-", f"not ISO format: {d}"

    def test_missing_drug_rows_dropped(self):
        raw = pd.DataFrame({
            "safetyreportid": ["R001", "R002"],
            "medicinalproduct": ["", "IBUPROFEN"],
            "reactionmeddrapt": ["NAUSEA", "NAUSEA"],
        })
        df = clean_faers_dataframe(raw)
        assert len(df) == 1  # only R002

    def test_missing_ae_rows_dropped(self):
        raw = pd.DataFrame({
            "safetyreportid": ["R001", "R002"],
            "medicinalproduct": ["ASPIRIN", "IBUPROFEN"],
            "reactionmeddrapt": ["", "NAUSEA"],
        })
        df = clean_faers_dataframe(raw)
        assert len(df) == 1

    def test_column_aliases_accepted(self):
        # "drug" and "reaction" are aliases for medicinalproduct/reactionmeddrapt
        raw = pd.DataFrame({
            "report_id": ["R001"],
            "drug":      ["ASPIRIN"],
            "reaction":  ["NAUSEA"],
        })
        df = clean_faers_dataframe(raw)
        assert "drug_name" in df.columns
        assert "adverse_event" in df.columns


class TestParseCsv:
    def test_parse_valid_csv(self):
        csv_text = "safetyreportid,medicinalproduct,reactionmeddrapt\nR001,ASPIRIN,NAUSEA\n"
        df = parse_csv(csv_text)
        assert len(df) == 1

    def test_parse_invalid_raises(self):
        # None is not a valid CSV string → io.StringIO(None) raises
        with pytest.raises(Exception):
            parse_csv(None)  # type: ignore[arg-type]


class TestValidateDataframe:
    def test_returns_dict_with_required_keys(self):
        df = pd.DataFrame({
            "report_id": ["R001"],
            "drug_name": ["aspirin"],
            "adverse_event": ["nausea"],
            "serious": ["1"],
            "receive_date": ["2023-01-15"],
        })
        report = validate_dataframe(df)
        for key in ("total_rows", "unique_reports", "unique_drugs", "unique_adverse_events"):
            assert key in report, f"Missing key: {key}"

    def test_empty_returns_zeros(self):
        df = pd.DataFrame(columns=["report_id", "drug_name", "adverse_event"])
        report = validate_dataframe(df)
        assert report["total_rows"] == 0

    def test_serious_pct(self):
        df = pd.DataFrame({
            "report_id": ["R001", "R002"],
            "drug_name": ["aspirin", "aspirin"],
            "adverse_event": ["nausea", "headache"],
            "serious": ["1", "0"],
            "receive_date": [None, None],
        })
        report = validate_dataframe(df)
        assert report["serious_pct"] == pytest.approx(50.0, abs=0.1)


# ─────────────────────────────────────────────────────────────────────────────
# Trend analysis
# ─────────────────────────────────────────────────────────────────────────────

class TestComputeTrend:
    @pytest.fixture
    def df(self):
        return pd.DataFrame({
            "drug_name":     ["aspirin", "aspirin", "aspirin", "ibuprofen"],
            "adverse_event": ["nausea",  "nausea",  "nausea",  "nausea"],
            "receive_date":  ["2023-01-15", "2023-04-10", "2023-07-20", "2023-01-01"],
        })

    def test_returns_list(self, df):
        result = compute_trend(df, "aspirin", "nausea")
        assert isinstance(result, list)

    def test_three_quarters(self, df):
        result = compute_trend(df, "aspirin", "nausea")
        assert len(result) == 3

    def test_sorted_chronologically(self, df):
        result = compute_trend(df, "aspirin", "nausea")
        quarters = [r["quarter"] for r in result]
        assert quarters == sorted(quarters)

    def test_missing_drug_returns_empty(self, df):
        result = compute_trend(df, "warfarin", "nausea")
        assert result == []

    def test_no_dates_returns_empty(self):
        df = pd.DataFrame({
            "drug_name":     ["aspirin"],
            "adverse_event": ["nausea"],
            "receive_date":  [None],
        })
        result = compute_trend(df, "aspirin", "nausea")
        assert result == []

    def test_each_item_has_quarter_and_count(self, df):
        result = compute_trend(df, "aspirin", "nausea")
        for item in result:
            assert "quarter" in item
            assert "count" in item
            assert isinstance(item["count"], int)


# ─────────────────────────────────────────────────────────────────────────────
# Signal config / thresholds
# ─────────────────────────────────────────────────────────────────────────────

class TestSignalThresholds:
    def test_default_thresholds(self):
        t = get_signal_thresholds()
        assert t.prr_signal_threshold == 2.0
        assert t.chi_square_threshold == 4.0
        assert t.min_report_count == 3

    def test_custom_threshold_object(self):
        t = SignalThresholds(
            prr_signal_threshold=4.0,
            chi_square_threshold=6.0,
            min_report_count=2,
        )
        assert classify_signal(4.5, 7.0, 1, t) == "weak_signal"
        assert classify_signal(4.5, 7.0, 2, t) == "signal"
        assert classify_signal(2.5, 7.0, 2, t) == "no_signal"
