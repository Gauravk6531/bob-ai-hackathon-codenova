"""AI explanation service using IBM watsonx.ai with deterministic fallback."""
from __future__ import annotations

import os
import logging

logger = logging.getLogger(__name__)

_DISCLAIMER = "⚠️ A safety signal is NOT proof of causality. Signals require clinical evaluation and further investigation before any regulatory or clinical decisions are made."

_SIGNAL_TEMPLATE = """The analysis identified pharmacovigilance safety signals based on Proportional Reporting Ratio (PRR) methodology applied to FAERS adverse event reports. {context} These findings are hypothesis-generating and require clinical expert review. {disclaimer}"""

_READINESS_TEMPLATE = """The CTD submission readiness assessment identified gaps in the regulatory dossier. {context} It is recommended to address high-priority missing sections before submission. {disclaimer}"""


def get_explanation(mode: str, context: str) -> dict:
    """
    Return an AI explanation for the provided context.
    Tries watsonx.ai first; falls back to a deterministic template.
    """
    api_key = os.getenv("WATSONX_API_KEY", "")
    project_id = os.getenv("WATSONX_PROJECT_ID", "")
    url = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

    if api_key and project_id:
        try:
            return _call_watsonx(api_key, project_id, url, mode, context)
        except Exception as exc:
            logger.warning("watsonx.ai call failed (%s), using fallback", exc)

    return _fallback_explanation(mode, context)


def _call_watsonx(api_key: str, project_id: str, url: str, mode: str, context: str) -> dict:
    """Call ibm/granite-3-8b-instruct via watsonx.ai SDK."""
    from ibm_watsonx_ai.foundation_models import ModelInference
    from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as Params

    prompt = _build_prompt(mode, context)
    model = ModelInference(
        model_id="ibm/granite-3-8b-instruct",
        credentials={"apikey": api_key, "url": url},
        project_id=project_id,
    )
    params = {
        Params.MAX_NEW_TOKENS: 512,
        Params.TEMPERATURE: 0.3,
        Params.STOP_SEQUENCES: ["\n\n"],
    }
    response = model.generate_text(prompt=prompt, params=params)
    return {
        "explanation": response.strip() + "\n\n" + _DISCLAIMER,
        "disclaimer": _DISCLAIMER,
        "source": "watsonx",
    }


def _build_prompt(mode: str, context: str) -> str:
    if mode == "signals":
        return (
            f"You are a pharmacovigilance expert. Explain the following drug safety signal analysis results "
            f"in plain language for a regulatory professional. Do not recalculate any numbers. "
            f"Include a disclaimer that signals are not proof of causality.\n\nResults:\n{context}\n\nExplanation:"
        )
    else:
        return (
            f"You are a regulatory affairs expert. Explain the following CTD submission readiness assessment "
            f"in plain language for a regulatory professional. Do not recalculate any scores. "
            f"Suggest how to prioritise the identified gaps.\n\nResults:\n{context}\n\nExplanation:"
        )


def _fallback_explanation(mode: str, context: str) -> dict:
    if mode == "signals":
        text = _SIGNAL_TEMPLATE.format(context=context, disclaimer=_DISCLAIMER)
    else:
        text = _READINESS_TEMPLATE.format(context=context, disclaimer=_DISCLAIMER)
    return {
        "explanation": text,
        "disclaimer": _DISCLAIMER,
        "source": "fallback",
    }
