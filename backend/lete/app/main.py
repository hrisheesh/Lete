from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from lete.app.db.migrations import bootstrap_db
from lete.app.api.health import router as health_router
from lete.app.api.workspaces import router as workspaces_router
from lete.app.config.settings import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run database migrations on startup
    bootstrap_db()
    yield

app = FastAPI(title=settings.project_name, lifespan=lifespan)

# CORS configuration to allow frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(
    workspaces_router, prefix=f"{settings.api_v1_str}/workspaces", tags=["workspaces"]
)
from lete.app.api.settings import router as settings_router
app.include_router(
    settings_router, prefix=f"{settings.api_v1_str}/settings", tags=["settings"]
)
from lete.app.api.documents import router as documents_router
app.include_router(
    documents_router, prefix=f"{settings.api_v1_str}", tags=["documents"]
)
from lete.app.api.retrieval import router as retrieval_router
app.include_router(
    retrieval_router, prefix=f"{settings.api_v1_str}", tags=["retrieval"]
)
from lete.app.api.queries import router as queries_router
app.include_router(
    queries_router, prefix=f"{settings.api_v1_str}", tags=["queries"]
)
