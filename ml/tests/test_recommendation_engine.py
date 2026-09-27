"""Tests for S6: the recommendation engine wired into real API mode.

Covers the pack's stated done-when: the fixture validates against RecommendResponse in real
mode, identical input gives identical output, /risk-score works and a 2x dose scores higher
risk than 1x. Also covers the deliberate design deviation (see recommendation_engine.py's
module docstring): a missing classifier degrades health but never blocks /recommend, and an
unpriced-but-needed product (MOP) is still recommended -- excluded from the cost breakdown
and flagged in data_notes, never a wrong number and never a whole-request failure.
"""

import json
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.api.config import Settings, get_settings
from src.api.main import app
from src.api.schemas import RecommendResponse, RiskScoreResponse
from src.data_pipeline import soil_data_loader
from src.engine.recommendation_engine import Engine

FIXTURES = Path(__file__).resolve().parents[2] / "docs" / "contract-fixtures"
TODAY = date(2026, 11, 20)


def load(name: str) -> dict:
    payload = json.loads((FIXTURES / name).read_text())
    payload.pop("_note", None)
    return payload


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, predict_mode="real")
        yield test_client
        app.dependency_overrides.clear()


@pytest.fixture
def client_without_classifier(monkeypatch, tmp_path):
    """Isolates the "no classifier registered" HTTP scenario from whatever registry.json
    actually exists on the machine running these tests. A registered classifier is now the
    normal, demo-ready local state (S3's random_forest is trained and registered as part of
    routine work here), so this can no longer rely on its ambient absence the way it could
    when "no classifier" was simply true on every fresh checkout -- forces it explicitly,
    the same way test_engine_model_version_when_no_model_is_registered already does at the
    unit level below."""
    import src.engine.recommendation_engine as engine_module

    monkeypatch.setattr(engine_module, "REGISTRY_PATH", tmp_path / "registry.json")
    with TestClient(app) as test_client:
        app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, predict_mode="real")
        yield test_client
        app.dependency_overrides.clear()


@pytest.fixture
def no_potash_request():
    # k=300 means no potash is needed at all, so these tests exercise the common dap/urea-only
    # path without also depending on MOP's pricing gap (covered on its own below).
    payload = load("recommend_request.json")
    payload["soil"] = {**payload["soil"], "k": 300.0}
    return payload


# ---------- health ----------


def test_health_is_degraded_with_no_classifier_registered(client_without_classifier):
    body = client_without_classifier.get("/health").json()
    assert body["status"] == "degraded"
    assert "no classifier model" in body["detail"]
    assert body["model_version"].startswith("unloaded+rules-")


# ---------- /recommend: the pack's stated done-when ----------


def test_recommend_in_real_mode_validates_against_recommend_response(client, no_potash_request):
    response = client.post("/recommend", json=no_potash_request)
    assert response.status_code == 200
    RecommendResponse.model_validate(response.json())


def test_recommend_is_deterministic(client, no_potash_request):
    first = client.post("/recommend", json=no_potash_request).json()
    second = client.post("/recommend", json=no_potash_request).json()
    assert first == second


def test_recommend_succeeds_with_no_classifier_registered(client_without_classifier, no_potash_request):
    # Deliberate design decision: the calculator alone is enough for a complete, correct
    # answer. A missing classifier degrades /health but never blocks /recommend.
    response = client_without_classifier.post("/recommend", json=no_potash_request)
    assert response.status_code == 200
    body = response.json()
    assert body["recommendation"]["fertilizer_type"] in {"urea", "dap"}
    assert body["model_version"].startswith("unloaded+rules-")


def test_recommend_matches_the_fixture_response_shape(client, no_potash_request):
    body = client.post("/recommend", json=no_potash_request).json()
    fixture_response = load("recommend_response.json")
    assert body["explanation"]["formula"] == fixture_response["explanation"]["formula"]
    assert set(body["explanation"]["nutrient_balance"]) == {"n", "p", "k"}


# ---------- error mapping ----------


def test_recommend_maps_an_unknown_crop_to_422(client, no_potash_request):
    payload = dict(no_potash_request, crop_type="not-a-real-crop")
    response = client.post("/recommend", json=payload)
    assert response.status_code == 422


def test_recommend_maps_an_unknown_growth_stage_to_422(client, no_potash_request):
    payload = dict(no_potash_request, growth_stage="not-a-real-stage")
    response = client.post("/recommend", json=payload)
    assert response.status_code == 422


def test_recommend_still_recommends_the_unpriced_mop_but_excludes_its_cost(client):
    payload = load("recommend_request.json")  # real soil.k=90 -- genuinely needs potash
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    body = response.json()
    mop_line = next(item for item in body["recommendation"]["schedule"] if item["fertilizer_type"] == "mop")
    assert mop_line["quantity_kg_per_acre"] > 0
    assert "mop" not in {line["fertilizer_type"] for line in body["cost"]["breakdown"]}
    assert any("mop" in note.lower() for note in body["explanation"]["data_notes"])


def test_recommend_maps_missing_reference_tables_to_503(client, no_potash_request, tmp_path, monkeypatch):
    monkeypatch.setattr(soil_data_loader, "EXTERNAL_DIR", tmp_path)
    app.state.engine = Engine()  # rebuild against the now-empty directory
    response = client.post("/recommend", json=no_potash_request)
    assert response.status_code == 503


# ---------- /risk-score ----------


def test_risk_score_in_real_mode_validates_and_a_2x_dose_scores_higher_than_1x(client, no_potash_request):
    def score(multiple: float) -> dict:
        payload = {k: v for k, v in no_potash_request.items() if k != "previous_fertilizer_usage"}
        payload["planned_application"] = [{"fertilizer_type": "urea", "quantity_kg_per_acre": 60.0 * multiple}]
        response = client.post("/risk-score", json=payload)
        assert response.status_code == 200
        RiskScoreResponse.model_validate(response.json())
        return response.json()

    once = score(1.0)
    twice = score(2.0)
    levels = {"low": 0, "medium": 1, "high": 2}
    assert levels[twice["risk"]["level"]] >= levels[once["risk"]["level"]]
    assert twice["nutrient_balance"]["n"]["ratio"] > once["nutrient_balance"]["n"]["ratio"]


# ---------- unit-level: Engine and helpers, without the HTTP layer ----------


def test_engine_model_version_when_no_model_is_registered(monkeypatch, tmp_path):
    empty_registry = tmp_path / "registry.json"
    import src.engine.recommendation_engine as engine_module

    monkeypatch.setattr(engine_module, "REGISTRY_PATH", empty_registry)
    engine = engine_module.Engine()
    assert engine.status == "degraded"
    assert engine.model is None
    assert engine.model_version.startswith("unloaded+rules-")


def test_engine_survives_a_corrupt_registry_file(monkeypatch, tmp_path):
    bad_registry = tmp_path / "registry.json"
    bad_registry.write_text("not valid json")
    import src.engine.recommendation_engine as engine_module

    monkeypatch.setattr(engine_module, "REGISTRY_PATH", bad_registry)
    engine = engine_module.Engine()  # must not raise
    assert engine.model is None
    assert engine.status == "degraded"
