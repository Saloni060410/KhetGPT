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


def test_health_in_real_mode_reports_the_unloaded_model(use_settings):
    use_settings(predict_mode="real")
    assert client.get("/health").json() == {"status": "ok", "model_version": "unloaded", "detail": None}


def test_fixtures_match_the_schemas():
    RecommendRequest.model_validate(load("recommend_request.json"))
    RecommendResponse.model_validate(load("recommend_response.json"))
    RiskScoreRequest.model_validate(load("risk_score_request.json"))
    RiskScoreResponse.model_validate(load("risk_score_response.json"))


def test_recommend_in_real_mode_is_not_implemented_until_the_engine_exists(use_settings):
    use_settings(predict_mode="real")
    assert client.post("/recommend", json=load("recommend_request.json")).status_code == 501


def test_risk_score_in_real_mode_is_not_implemented_until_the_analyzer_exists(use_settings):
    use_settings(predict_mode="real")
    assert client.post("/risk-score", json=load("risk_score_request.json")).status_code == 501


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
