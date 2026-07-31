import os
from dotenv import load_dotenv

load_dotenv("/run/secrets/.env", override=False)
load_dotenv("../secrets/.env", override=False)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine
from models import Base
from routers import situations, sessions, dashboard, tts, review

Base.metadata.create_all(bind=engine)

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE session_vocabulary ADD COLUMN IF NOT EXISTS meaning_ja VARCHAR(200)"))

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
app.include_router(review.router)


@app.get("/health")
def health():
    return {"status": "ok"}
