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


def test_health_in_real_mode_is_degraded_with_no_classifier_registered(use_settings):
    # S6: real mode is implemented now. With no classifier registered (the normal state on a
    # fresh checkout -- see ml/PROGRESS.md), health degrades but still reports a model_version.
    use_settings(predict_mode="real")
    body = client.get("/health").json()
    assert body["status"] == "degraded"
    assert body["model_version"].startswith("unloaded+rules-")


def test_fixtures_match_the_schemas():
    RecommendRequest.model_validate(load("recommend_request.json"))
    RecommendResponse.model_validate(load("recommend_response.json"))
    RiskScoreRequest.model_validate(load("risk_score_request.json"))
    RiskScoreResponse.model_validate(load("risk_score_response.json"))


def test_recommend_in_real_mode_is_implemented_and_surfaces_the_real_mop_price_gap(use_settings):
    # S6: real mode is implemented now. The fixture's soil.k=90 genuinely needs potash, and
    # MOP has no price yet in the merged fertilizer_products.csv (see ml/PROGRESS.md) -- the
    # engine correctly refuses with 503 rather than a silent wrong answer.
    use_settings(predict_mode="real")
    response = client.post("/recommend", json=load("recommend_request.json"))
    assert response.status_code == 503
    assert "mop" in response.json()["detail"]


def test_risk_score_in_real_mode_is_implemented(use_settings):
    # S6: real mode is implemented now. /risk-score never calls to_products(), so it isn't
    # affected by the MOP-price gap that blocks /recommend for this same field.
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
