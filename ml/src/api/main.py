from fastapi import FastAPI

from src.api.endpoints import health, recommend, risk_score

app = FastAPI(title="KhetGPT ML Service")
app.include_router(health.router)
app.include_router(recommend.router)
app.include_router(risk_score.router)
