"""FastAPI dependencies shared across endpoints. Kept separate from main.py to avoid a
circular import (main.py mounts the endpoint routers; the endpoints need this dependency)."""

from typing import Annotated

from fastapi import Depends, Request

from src.engine.recommendation_engine import Engine


def get_engine(request: Request) -> Engine:
    return request.app.state.engine


EngineDep = Annotated[Engine, Depends(get_engine)]
