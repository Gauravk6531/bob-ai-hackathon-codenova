from __future__ import annotations

from typing import Any

from .normalize import coerce_date, normalize_text, normalize_upper


def get_report_id(report: dict) -> str | None:
    for key in ('safetyreportid', 'report_id', 'id'):
        value = report.get(key)
        if value not in (None, ''):
            return str(value)
    return None


def get_patient(report: dict) -> dict:
    return report.get('patient', {}) if isinstance(report.get('patient'), dict) else {}


def get_drug_entries(report: dict) -> list[dict]:
    patient = get_patient(report)
    drugs = patient.get('drug', [])
    if isinstance(drugs, dict):
        drugs = [drugs]
    return [d for d in drugs if isinstance(d, dict)]


def get_reaction_entries(report: dict) -> list[dict]:
    patient = get_patient(report)
    reactions = patient.get('reaction', [])
    if isinstance(reactions, dict):
        reactions = [reactions]
    return [r for r in reactions if isinstance(r, dict)]


def normalize_record(report: dict) -> dict:
    patient = get_patient(report)
    report_id = get_report_id(report)
    patient_sex = patient.get('patientsex')
    age = patient.get('patientage')
    age_unit = patient.get('patientageunit')
    weight = patient.get('patientweight')

    normalized_rows: list[dict] = []
    for drug in get_drug_entries(report):
        drug_name_raw = drug.get('medicinalproduct') or drug.get('product') or drug.get('drugname')
        drug_role = drug.get('drugcharacterization')
        indication = drug.get('indication')
        route = drug.get('drugauthorizationroute') or drug.get('route')
        dosage = drug.get('dosage') or drug.get('dose') or drug.get('drugdosage')
        for reaction in get_reaction_entries(report):
            reaction_name_raw = reaction.get('reactionmeddrapt') or reaction.get('reactionmeddraversionpt') or reaction.get('term')
            seriousness = report.get('serious')
            reaction_outcome = reaction.get('outcome')
            row = {
                'report_id': report_id,
                'report_date': coerce_date(report.get('receiptdate') or report.get('receivedate') or report.get('safetyreportid')),
                'receive_date': coerce_date(report.get('receivedate') or report.get('receiptdate')),
                'country': normalize_text(report.get('primarysource', {}).get('country')) or normalize_text(report.get('country')),
                'source': normalize_text(report.get('primarysource', {}).get('reportercountry')) or normalize_text(report.get('source')),
                'patient_age': age,
                'patient_age_unit': age_unit,
                'patient_sex': normalize_upper(patient_sex) if patient_sex is not None else None,
                'patient_weight': weight,
                'drug_name_raw': normalize_text(drug_name_raw),
                'drug_name_normalized': normalize_text(drug_name_raw),
                'drug_role': normalize_text(drug_role),
                'drug_indication': normalize_text(indication),
                'drug_route': normalize_text(route),
                'drug_dosage': normalize_text(dosage),
                'reaction_raw': normalize_text(reaction_name_raw),
                'reaction_normalized': normalize_text(reaction_name_raw),
                'reaction_outcome': normalize_text(reaction_outcome),
                'seriousness': normalize_text(seriousness),
            }
            normalized_rows.append(row)
    return normalized_rows


def clean_records(raw_records: list[dict]) -> list[dict]:
    cleaned: list[dict] = []
    for record in raw_records:
        cleaned.extend(normalize_record(record))
    return cleaned
