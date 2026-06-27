from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from lete.app.api.health import router as health_router
from lete.app.api.workspaces import router as workspaces_router
from lete.app.config.settings import settings

app = FastAPI(title=settings.project_name)

# CORS configuration to allow frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
