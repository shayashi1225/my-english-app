import os
from dotenv import load_dotenv

load_dotenv("/run/secrets/.env", override=False)
load_dotenv("../secrets/.env", override=False)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
from routers import situations, sessions, dashboard, tts

Base.metadata.create_all(bind=engine)

app = FastAPI(title="My English App API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(situations.router)
app.include_router(sessions.router)
app.include_router(dashboard.router)
app.include_router(tts.router)


@app.get("/health")
def health():
    return {"status": "ok"}
