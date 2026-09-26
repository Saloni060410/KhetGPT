from fastapi import FastAPI

from src.api.endpoints import health, predict

app = FastAPI(title="KhetGPT ML Service")
app.include_router(health.router)
app.include_router(predict.router)
