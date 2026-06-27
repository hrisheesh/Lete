from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from lete.app.api.health import router as health_router
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
