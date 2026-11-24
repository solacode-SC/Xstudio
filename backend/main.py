import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import process
from utils.cleanup import cleanup_task

TMP_DIR = "./tmp"
os.makedirs(TMP_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_task())
    try:
        yield
    finally:
        task.cancel()


app = FastAPI(
    title="Xstudio Precision PDF Engine",
    version="2.0.0",
    description="High-fidelity, zero-retention PDF manipulation microservice.",
    lifespan=lifespan,
)

env = os.getenv("ENV", "production").lower()
origins_env = os.getenv("ALLOWED_ORIGINS", "")
if origins_env:
    allowed_origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
else:
    allowed_origins = [
        "https://xstudio.solaymanbuilds.com",
        "http://xstudio.solaymanbuilds.com",
        "https://xstudio.solaymantech.me",
    ]
    if env != "production":
        allowed_origins += [
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:3000",
        ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/files", StaticFiles(directory=TMP_DIR), name="files")
app.include_router(process.router, prefix="/api")


@app.get("/")
def root():
    return {
        "service": "Xstudio PDF Engine",
        "version": "2.0.0",
        "status": "ok",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "retention_seconds": 600,
        "max_upload_mb": 100,
    }
