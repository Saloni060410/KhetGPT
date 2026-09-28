import shutil

import httpx
import pytest

from src.data_pipeline.soil_reference import (
    CACHE_DIR,
    NOT_MAPPED,
    SOILGRIDS_URL,
    SoilReferenceError,
    get_soil_estimate,
)

# Real shape, verified live against https://rest.isric.org/soilgrids/v2.0/properties/query
# (2026-09-27) for a point with coverage.
COVERED_RESPONSE = {
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [76.0, 31.0]},
    "properties": {
        "layers": [
            {
                "name": "phh2o",
                "unit_measure": {"d_factor": 10, "mapped_units": "pH*10", "target_units": "-"},
                "depths": [{"range": {"top_depth": 0, "bottom_depth": 5, "unit_depth": "cm"}, "label": "0-5cm", "values": {"mean": 77}}],
            },
            {
                "name": "soc",
                "unit_measure": {"d_factor": 10, "mapped_units": "dg/kg", "target_units": "g/kg"},
                "depths": [{"range": {"top_depth": 0, "bottom_depth": 5, "unit_depth": "cm"}, "label": "0-5cm", "values": {"mean": 65}}],
            },
        ]
    },
}

# Real shape, verified live for Ludhiana city center (30.911, 75.847 -- our own R11 demo
# coordinates) and Delhi (28.6, 77.2): SoilGrids returns null for every property at these exact
# points, while nearby rural points return real data. This is SoilGrids' own response, not a
# client-side failure.
NO_COVERAGE_RESPONSE = {
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [75.847, 30.911]},
    "properties": {
        "layers": [
            {
                "name": "phh2o",
                "unit_measure": {"d_factor": 10, "mapped_units": "pH*10", "target_units": "-"},
                "depths": [{"range": {"top_depth": 0, "bottom_depth": 5, "unit_depth": "cm"}, "label": "0-5cm", "values": {"mean": None}}],
            },
            {
                "name": "soc",
                "unit_measure": {"d_factor": 10, "mapped_units": "dg/kg", "target_units": "g/kg"},
                "depths": [{"range": {"top_depth": 0, "bottom_depth": 5, "unit_depth": "cm"}, "label": "0-5cm", "values": {"mean": None}}],
            },
        ]
    },
}


def _mock_client(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


@pytest.fixture(autouse=True)
def clean_cache():
    if CACHE_DIR.exists():
        shutil.rmtree(CACHE_DIR)
    yield
    if CACHE_DIR.exists():
        shutil.rmtree(CACHE_DIR)


def test_get_soil_estimate_converts_ph_and_organic_carbon_correctly():
    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url).startswith(SOILGRIDS_URL)
        return httpx.Response(200, json=COVERED_RESPONSE)

    result = get_soil_estimate(31.0, 76.0, client=_mock_client(handler))
    assert result["ph"] == pytest.approx(7.7)  # 77 / d_factor 10
    assert result["organic_carbon_pct"] == pytest.approx(0.65)  # 65 / 10 (d_factor) / 10 (g/kg -> %)
    assert result["coverage"] == {"ph": True, "organic_carbon_pct": True}
    assert "soilgrids" in result["source"].lower()


def test_get_soil_estimate_never_fills_in_n_p_k_or_moisture():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=COVERED_RESPONSE)

    result = get_soil_estimate(31.0, 76.0, client=_mock_client(handler))
    assert result["n"] is None
    assert result["p"] is None
    assert result["k"] is None
    assert result["moisture"] is None
    assert set(NOT_MAPPED) == {"n", "p", "k", "moisture"}  # every unmapped field has a stated reason


def test_get_soil_estimate_reports_no_coverage_as_none_not_an_error():
    # Real, observed behavior for our own demo coordinates (Ludhiana city center) -- must
    # degrade to None/False, never raise, never invent a plausible-looking number.
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=NO_COVERAGE_RESPONSE)

    result = get_soil_estimate(30.911, 75.847, client=_mock_client(handler))
    assert result["ph"] is None
    assert result["organic_carbon_pct"] is None
    assert result["coverage"] == {"ph": False, "organic_carbon_pct": False}


def test_get_soil_estimate_raises_soil_reference_error_on_http_failure():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"error": "down"})

    with pytest.raises(SoilReferenceError):
        get_soil_estimate(31.0, 76.0, client=_mock_client(handler))


def test_get_soil_estimate_retries_once_then_succeeds():
    attempts = []

    def handler(request: httpx.Request) -> httpx.Response:
        attempts.append(1)
        if len(attempts) == 1:
            raise httpx.ConnectTimeout("simulated timeout", request=request)
        return httpx.Response(200, json=COVERED_RESPONSE)

    result = get_soil_estimate(31.0, 76.0, client=_mock_client(handler))
    assert len(attempts) == 2
    assert result["ph"] == pytest.approx(7.7)


def test_get_soil_estimate_uses_the_file_cache_on_second_call():
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(1)
        return httpx.Response(200, json=COVERED_RESPONSE)

    get_soil_estimate(31.0, 76.0, client=_mock_client(handler))
    get_soil_estimate(31.0, 76.0, client=_mock_client(handler))
    assert len(calls) == 1  # second call served from ml/data/raw/soil_reference_cache/


def test_get_soil_estimate_raises_on_an_unexpected_response_shape():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"properties": {"layers": []}})

    with pytest.raises(SoilReferenceError):
        get_soil_estimate(31.0, 76.0, client=_mock_client(handler))
