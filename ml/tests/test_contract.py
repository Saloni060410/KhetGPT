"""S7: contract tests.

Round-trips the fixtures in docs/contract-fixtures/ through /recommend and /risk-score in both
mock and real mode, and checks the response against the *shape* of the paired response fixture
(types and required keys, via RecommendResponse/RiskScoreResponse.model_validate) -- never the
numbers, which the fixtures' own "_note" already says are illustrative. Also exercises the two
documented error shapes end to end (docs/api-contract.md rule 9): `422 { detail: [...] }` for
both FastAPI's own pydantic validation and business-logic errors converted by src/api/errors.py,
and `503 { detail }` for the model/reference-data-unavailable case.
"""

import json
from pathlib import Path

from fastapi.testclient import TestClient

from src.api.main import app
from src.api.schemas import RecommendResponse, RiskScoreResponse
from src.data_pipeline import soil_data_loader
from src.engine.recommendation_engine import Engine

FIXTURES = Path(__file__).resolve().parents[2] / "docs" / "contract-fixtures"
client = TestClient(app)


def load(name: str) -> dict:
    payload = json.loads((FIXTURES / name).read_text())
    payload.pop("_note", None)
    return payload


# ---------- /recommend: shape round-trip, both modes ----------


def test_recommend_mock_mode_matches_the_response_shape(use_settings):
    use_settings(predict_mode="mock")
    response = client.post("/recommend", json=load("recommend_request.json"))
    assert response.status_code == 200
    RecommendResponse.model_validate(response.json())


def test_recommend_real_mode_matches_the_response_shape(use_settings):
    # The literal fixture's soil.k=90 genuinely needs potash; MOP has no verified price yet
    # (ml/PROGRESS.md) but is still recommended (excluded from cost.breakdown, flagged in
    # data_notes) rather than the whole request failing -- so the plain fixture round-trips
    # to a 200 and the full response shape, no potash-avoiding variant needed.
    use_settings(predict_mode="real")
    response = client.post("/recommend", json=load("recommend_request.json"))
    assert response.status_code == 200
    body = response.json()
    RecommendResponse.model_validate(body)
    assert "mop" in {item["fertilizer_type"] for item in body["recommendation"]["schedule"]}
    # MOP is priced now (PIB Release ID 2237470) -- included in the breakdown like any other
    # product; see test_recommendation_engine.py's test_recommend_now_prices_mop... for the
    # full before/after story.
    assert "mop" in {line["fertilizer_type"] for line in body["cost"]["breakdown"]}


# ---------- /risk-score: shape round-trip, both modes ----------


def test_risk_score_mock_mode_matches_the_response_shape(use_settings):
    use_settings(predict_mode="mock")
    response = client.post("/risk-score", json=load("risk_score_request.json"))
    assert response.status_code == 200
    RiskScoreResponse.model_validate(response.json())


def test_risk_score_real_mode_matches_the_response_shape(use_settings):
    # Unlike /recommend, risk-score never selects or prices a product (RiskScoreResponse has
    # no cost block) -- the literal fixture's soil.k=90 does not hit the MOP gap here, verified
    # directly rather than assumed.
    use_settings(predict_mode="real")
    response = client.post("/risk-score", json=load("risk_score_request.json"))
    assert response.status_code == 200
    RiskScoreResponse.model_validate(response.json())


# ---------- error shapes: 422 { detail: [...] }, 503 { detail } ----------


def test_pydantic_validation_error_matches_the_422_shape(use_settings):
    use_settings(predict_mode="real")
    payload = load("recommend_request.json")
    payload["soil"]["ph"] = 99  # out of the 0-14 range
    response = client.post("/recommend", json=payload)
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list) and detail
    assert {"loc", "msg", "type"} <= detail[0].keys()


def test_business_logic_error_also_matches_the_422_shape(use_settings):
    # Before src/api/errors.py, this was `{"detail": "<string>"}` -- a real drift from the
    # contract, which has always said `{ detail: [...] }`. Fixed at the handler, not here.
    use_settings(predict_mode="real")
    payload = load("recommend_request.json")
    payload["crop_type"] = "not_a_real_crop"
    response = client.post("/recommend", json=payload)
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list) and detail
    assert {"loc", "msg", "type"} <= detail[0].keys()


def test_service_unavailable_error_matches_the_503_shape(use_settings, monkeypatch, tmp_path):
    # A needed nutrient with no priced product (e.g. MOP) no longer produces a 503 (see the
    # round-trip test above) -- the current, live-reachable way to force this is reference
    # data failing to load entirely, the same technique test_recommendation_engine.py's
    # test_recommend_maps_missing_reference_tables_to_503 already uses.
    use_settings(predict_mode="real")
    monkeypatch.setattr(soil_data_loader, "EXTERNAL_DIR", tmp_path)
    # setattr, not a bare assignment: `client` is this module's bare TestClient(app) (no `with`,
    # same as test_api.py), so nothing else re-triggers the lifespan between tests in this
    # file -- monkeypatch.setattr is what restores the real engine after this test ends.
    monkeypatch.setattr(app.state, "engine", Engine())
    response = client.post("/recommend", json=load("recommend_request.json"))
    assert response.status_code == 503
    assert isinstance(response.json()["detail"], str)


def test_request_over_the_size_limit_is_rejected(use_settings):
    use_settings(predict_mode="mock")  # the size middleware runs before mode branching
    payload = load("recommend_request.json")
    payload["previous_fertilizer_usage"] = payload["previous_fertilizer_usage"] * 5000
    response = client.post("/recommend", json=payload)
    assert response.status_code == 413


# ---------- error fixtures vs. what this service actually returns ----------


def test_error_fixtures_match_the_shapes_this_service_actually_returns():
    error_422 = json.loads((FIXTURES / "error_422.json").read_text())
    assert isinstance(error_422["detail"], list)
    assert {"loc", "msg", "type"} <= error_422["detail"][0].keys()

    error_503 = json.loads((FIXTURES / "error_503.json").read_text())
    assert isinstance(error_503["detail"], str)
