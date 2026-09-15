# FDA Adverse Event Dataset Preparation

## Source

The pipeline uses the official openFDA Drug Adverse Event API:

- https://api.fda.gov/drug/event.json

## Retrieval Methodology

- Query uses the `receivedate` search field with a date range.
- Pagination is handled with `limit` and `skip` parameters.
- The pipeline requests data in batches and stops once the target record count is reached.
- The target is configurable via `TARGET_RECORDS` and can be increased without changing the overall logic.

## Target and Actual Size

- Target records: 150000
- Actual records are determined by executing the pipeline against the live FDA API.

## Schema

The normalized CSV contains one row per report-drug-reaction combination. Each row preserves the report identifier and associated drug/reaction information while keeping the original raw names available in parallel columns.

Columns include:

- report_id
- report_date
- receive_date
- country
- source
- patient_age
- patient_age_unit
- patient_sex
- patient_weight
- drug_name_raw
- drug_name_normalized
- drug_role
- drug_indication
- drug_route
- drug_dosage
- reaction_raw
- reaction_normalized
- reaction_outcome
- seriousness

## Preprocessing Steps

1. Fetch raw FDA records in configurable batches.
2. Save raw API responses under `data/raw/`.
3. Flatten nested patient and drug/reaction structures.
4. Keep original raw values and normalized versions separately.
5. Normalize dates and string fields conservatively.
6. Remove invalid records where required identifiers or drug/reaction names are missing.
7. Drop exact duplicate rows after cleaning.
8. Validate the final dataset and save summary metrics.

## Duplicate Strategy

The pipeline preserves the original report-level information and avoids deleting legitimate multiple drugs or multiple reactions from the same report. Duplicate handling is limited to exact duplicate normalized rows after cleaning.

## Missing Value Strategy

Missing values are not filled with fabricated placeholders. Fields that are absent in the FDA source remain missing, and the dataset quality summary reports their percentage.

## Limitations

- This is a data-preparation stage only; no PRR and no ML model is implemented.
- FDA data may contain incomplete or inconsistent source information.
- The pipeline is designed for reproducible extraction and transformation, not causal inference.

## Reproducibility

Run:

```bash
python scripts/prepare_dataset.py
```

The command will fetch the dataset, normalize it, validate it, and save outputs under `data/processed/` and `data/metadata/`.
