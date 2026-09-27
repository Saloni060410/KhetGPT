from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.endpoints import health, recommend, reference, risk_score
from src.engine.recommendation_engine import Engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Loaded once at startup (S6): reference tables, agronomy rules and whatever classifier
    # is registered. Real mode reads this; mock mode never touches it.
    app.state.engine = Engine()
    yield


app = FastAPI(title="KhetGPT ML Service", lifespan=lifespan)

# Also set eagerly at import time, not only in the lifespan above: a bare TestClient(app)
# (no `with` block) never runs FastAPI's startup event, and EngineDep is resolved on every
# request to these routers even in mock mode (FastAPI resolves declared dependencies
# regardless of a handler's own early return). Without this, every mock-mode test predating
# S6 would break on a missing app.state.engine. Real deployments (uvicorn) still get a fresh
# Engine() from the lifespan at startup; this is just a safe, idempotent default.
app.state.engine = Engine()

app.include_router(health.router)
app.include_router(recommend.router)
app.include_router(risk_score.router)
app.include_router(reference.router)
