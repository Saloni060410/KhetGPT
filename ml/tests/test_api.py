from fastapi.testclient import TestClient

from src.api.main import app

client = TestClient(app)


def test_health_reports_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_predict_is_not_implemented_until_model_is_trained():
    payload = {
        "field_id": "f1",
        "crop_type": "wheat",
        "growth_stage": "tillering",
        "soil": {"n": 1, "p": 1, "k": 1, "ph": 7, "organic_carbon": 0.5, "moisture": 20},
        "weather": {"temperature_c": 25, "humidity_pct": 60, "rainfall_mm_forecast": 0},
    }
    assert client.post("/predict", json=payload).status_code == 501
