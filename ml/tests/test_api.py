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


def test_fixtures_match_the_schemas():
    RecommendRequest.model_validate(load("recommend_request.json"))
    RecommendResponse.model_validate(load("recommend_response.json"))
    RiskScoreRequest.model_validate(load("risk_score_request.json"))
    RiskScoreResponse.model_validate(load("risk_score_response.json"))


def test_recommend_is_not_implemented_until_the_engine_exists():
    assert client.post("/recommend", json=load("recommend_request.json")).status_code == 501


def test_risk_score_is_not_implemented_until_the_analyzer_exists():
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
