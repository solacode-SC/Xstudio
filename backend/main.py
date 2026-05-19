import os
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import process
from utils.cleanup import cleanup_task

app = FastAPI(title="Xstudio API")

env = os.getenv("ENV", "production").lower()
origins_env = os.getenv("ALLOWED_ORIGINS", "")
if origins_env:
    allowed_origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
else:
    allowed_origins = ["https://xstudio.solaymantech.me"]
    if env != "production":
        allowed_origins += ["http://localhost:3001", "http://127.0.0.1:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TMP_DIR = "./tmp"
os.makedirs(TMP_DIR, exist_ok=True)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_task())

app.mount("/files", StaticFiles(directory=TMP_DIR), name="files")

app.include_router(process.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "ok"}
