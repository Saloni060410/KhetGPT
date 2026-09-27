from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.api.endpoints import health, recommend, reference, risk_score
from src.api.errors import register_exception_handlers
from src.api.logging_utils import configure_request_logging
from src.engine.recommendation_engine import Engine

# S7: bounded well above any real payload (previous_fertilizer_usage would need 500+ entries
# to approach this) so a malformed or oversized body can't tie up the process. Not tuned to
# any observed traffic pattern -- there isn't one yet, this is a hardening default.
MAX_REQUEST_BYTES = 64 * 1024


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Loaded once at startup (S6): reference tables, agronomy rules and whatever classifier
    # is registered. Real mode reads this; mock mode never touches it.
    app.state.engine = Engine()
    yield


app = FastAPI(
    title="KhetGPT ML Service",
    lifespan=lifespan,
    # S7: every request/response model below carries a full example (see schemas.py), so
    # /docs (Swagger) always has a realistic, pre-filled "Try it out" body rather than an
    # empty or all-zeros one.
)

configure_request_logging()
register_exception_handlers(app)


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length is not None and int(content_length) > MAX_REQUEST_BYTES:
        return JSONResponse(
            status_code=413,
            content={"detail": f"Request body exceeds the {MAX_REQUEST_BYTES}-byte limit"},
        )
    return await call_next(request)


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
