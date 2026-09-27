import json
from pathlib import Path

from fastapi.testclient import TestClient

from src.api.main import app
from src.api.schemas import (
    RecommendRequest,
    RecommendResponse,
    RiskScoreRequest,
    RiskScoreResponse,
    Soil,
)

client = TestClient(app)
FIXTURES = Path(__file__).resolve().parents[2] / "docs" / "contract-fixtures"


def load(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text())


def test_health_reports_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_says_when_it_is_in_mock_mode():
    body = client.get("/health").json()
    assert body["model_version"] == "mock-0.0.0+rules-mock"
    assert "mock" in body["detail"]


def test_health_in_real_mode_is_degraded_with_no_classifier_registered(use_settings, monkeypatch, tmp_path):
    # S6: real mode is implemented now. Forces the "no classifier registered" scenario
    # explicitly rather than relying on it being the ambient state -- a registered classifier
    # is the normal, demo-ready local state now (S3's random_forest), not the absence of one.
    import src.engine.recommendation_engine as engine_module

    monkeypatch.setattr(engine_module, "REGISTRY_PATH", tmp_path / "registry.json")
    monkeypatch.setattr(app.state, "engine", engine_module.Engine())
    use_settings(predict_mode="real")
    body = client.get("/health").json()
    assert body["status"] == "degraded"
    assert body["model_version"].startswith("unloaded+rules-")


def test_fixtures_match_the_schemas():
    RecommendRequest.model_validate(load("recommend_request.json"))
    RecommendResponse.model_validate(load("recommend_response.json"))
    RiskScoreRequest.model_validate(load("risk_score_request.json"))
    RiskScoreResponse.model_validate(load("risk_score_response.json"))


def test_recommend_in_real_mode_is_implemented_and_still_recommends_the_unpriced_mop(use_settings):
    # S6: real mode is implemented now. The fixture's soil.k=90 genuinely needs potash, and
    # MOP has no verified price yet in the merged fertilizer_products.csv (Richa re-checked
    # 2026-09-27: IFFCO's own price list doesn't carry it, market listings too inconsistent to
    # cite). Per the current product decision, that no longer blocks the recommendation: MOP
    # is still recommended with a real quantity, just excluded from the cost breakdown and
    # flagged in data_notes instead of the whole request failing.
    use_settings(predict_mode="real")
    response = client.post("/recommend", json=load("recommend_request.json"))
    assert response.status_code == 200
    body = response.json()
    assert "mop" in {item["fertilizer_type"] for item in body["recommendation"]["schedule"]}
    assert "mop" not in {line["fertilizer_type"] for line in body["cost"]["breakdown"]}
    assert any("mop" in note.lower() for note in body["explanation"]["data_notes"])


def test_risk_score_in_real_mode_is_implemented(use_settings):
    # S6: real mode is implemented now. /risk-score never calls to_products(), so it isn't
    # affected by MOP's pricing gap that data_notes flags for /recommend on this same field.
    use_settings(predict_mode="real")
    response = client.post("/risk-score", json=load("risk_score_request.json"))
    assert response.status_code == 200
    assert response.json()["risk"]["level"] in {"low", "medium", "high"}


def test_invalid_soil_is_rejected():
    payload = load("recommend_request.json")
    payload["soil"]["ph"] = 19
    assert client.post("/recommend", json=payload).status_code == 422


def test_soil_schema_is_fixed_by_the_problem_statement():
    assert set(Soil.model_fields) == {"n", "p", "k", "ph", "organic_carbon", "moisture"}


def test_schedule_allows_an_unsourced_stage_date():
    payload = load("recommend_response.json")
    assert any(item["apply_by"] is None for item in payload["recommendation"]["schedule"])
    RecommendResponse.model_validate(payload)


def test_unknown_irrigation_is_rejected():
    payload = load("recommend_request.json")
    payload["irrigation"] = "flooded"
    assert client.post("/recommend", json=payload).status_code == 422


def test_cost_breakdown_adds_up_to_the_estimate():
    cost = load("recommend_response.json")["cost"]
    assert abs(sum(line["cost_inr_per_acre"] for line in cost["breakdown"]) - cost["estimated_cost_inr_per_acre"]) <= 1
