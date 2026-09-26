"""Plain-language explanations (contract C6). render_template() is built now, as a
dependency of R8's risk_analyzer.py. explain() (ranking rule_trace items, XGBoost
pred_contribs for the product choice) is R10's job, not implemented yet.
"""

from pathlib import Path

import yaml

EXTERNAL_DIR = Path(__file__).resolve().parents[2] / "data" / "external"
TEMPLATES_PATH = EXTERNAL_DIR / "explanation_templates.yaml"

DEFAULT_LANGUAGE = "en"


class TemplateError(Exception):
    """A template id doesn't exist, or a required {placeholder} wasn't supplied."""


def _load_templates() -> dict:
    with TEMPLATES_PATH.open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def render_template(template_id: str, language: str = DEFAULT_LANGUAGE, **params) -> str:
    """Render explanation_templates.yaml's template_id with **params. Raises TemplateError
    for a missing id or a missing placeholder -- never silently drops a value or renders a
    sentence with an unfilled {placeholder} in it."""
    templates = _load_templates()
    if template_id not in templates:
        raise TemplateError(f"template_id {template_id!r} not found in {TEMPLATES_PATH.name}")

    entry = templates[template_id]
    if language not in entry:
        raise TemplateError(f"template {template_id!r} has no {language!r} sentence")

    try:
        return entry[language].format(**params)
    except KeyError as exc:
        raise TemplateError(f"template {template_id!r} is missing param {exc} (got {sorted(params)})") from exc
