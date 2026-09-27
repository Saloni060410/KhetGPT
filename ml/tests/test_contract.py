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

FIXTURES = Path(__file__).resolve().parents[2] / "docs" / "contract-fixtures"
client = TestClient(app)


def load(name: str) -> dict:
    payload = json.loads((FIXTURES / name).read_text())
    payload.pop("_note", None)
    return payload


def _no_potash_recommend_request() -> dict:
    # The literal fixture's soil.k=90 genuinely needs potash, and MOP has no price yet
    # (ml/PROGRESS.md) -- real mode correctly 503s on it, exercised below rather than masked.
    # This variant is for the *success*-shape round trip in real mode.
    payload = load("recommend_request.json")
    payload["soil"] = {**payload["soil"], "k": 300.0}
    return payload


# ---------- /recommend: shape round-trip, both modes ----------


def test_recommend_mock_mode_matches_the_response_shape(use_settings):
    use_settings(predict_mode="mock")
    response = client.post("/recommend", json=load("recommend_request.json"))
    assert response.status_code == 200
    RecommendResponse.model_validate(response.json())


def test_recommend_real_mode_matches_the_response_shape(use_settings):
    use_settings(predict_mode="real")
    response = client.post("/recommend", json=_no_potash_recommend_request())
    assert response.status_code == 200
    RecommendResponse.model_validate(response.json())


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
    payload = _no_potash_recommend_request()
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
    payload = _no_potash_recommend_request()
    payload["crop_type"] = "not_a_real_crop"
    response = client.post("/recommend", json=payload)
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list) and detail
    assert {"loc", "msg", "type"} <= detail[0].keys()


def test_service_unavailable_error_matches_the_503_shape(use_settings):
    # The literal fixture (soil.k=90) genuinely needs potash and MOP has no price yet -- the
    # engine correctly refuses rather than guess. This is the same, real, standing gap
    # documented in ml/PROGRESS.md, exercised here as the 503 contract case.
    use_settings(predict_mode="real")
    response = client.post("/recommend", json=load("recommend_request.json"))
    assert response.status_code == 503
    assert isinstance(response.json()["detail"], str)


def test_request_over_the_size_limit_is_rejected(use_settings):
    use_settings(predict_mode="mock")  # the size middleware runs before mode branching
    payload = _no_potash_recommend_request()
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
