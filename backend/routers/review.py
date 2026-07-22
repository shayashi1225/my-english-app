from datetime import datetime
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession
from database import get_db
from models import Session, SessionVocabulary
from services import review_service

router = APIRouter(prefix="/api/review", tags=["review"])


class AnswerRequest(BaseModel):
    rating: Literal["again", "hard", "good"]


@router.get("/queue")
def get_queue(limit: int = 20, db: DBSession = Depends(get_db)):
    now = datetime.utcnow()

    due_count = db.query(SessionVocabulary).filter(
        SessionVocabulary.next_review_at <= now
    ).count()

    rows = (
        db.query(SessionVocabulary, Session.situation_title)
        .join(Session, Session.id == SessionVocabulary.session_id)
        .filter(SessionVocabulary.next_review_at <= now)
        .order_by(SessionVocabulary.next_review_at.asc())
        .limit(limit)
        .all()
    )

    return {
        "due_count": due_count,
        "items": [
            {
                "id": v.id,
                "word_or_phrase": v.word_or_phrase,
                "explanation": v.explanation,
                "example_sentence": v.example_sentence,
                "box": v.box,
                "next_review_at": v.next_review_at,
                "last_reviewed_at": v.last_reviewed_at,
                "situation_title": title,
            }
            for v, title in rows
        ],
    }


@router.post("/{vocab_id}/answer")
def answer(vocab_id: int, req: AnswerRequest, db: DBSession = Depends(get_db)):
    vocab = db.query(SessionVocabulary).filter(SessionVocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary item not found")

    new_box, next_review_at = review_service.apply_rating(vocab.box, req.rating)
    vocab.box = new_box
    vocab.next_review_at = next_review_at
    vocab.last_reviewed_at = datetime.utcnow()
    vocab.review_count = (vocab.review_count or 0) + 1
    db.commit()

    return {"id": vocab.id, "box": vocab.box, "next_review_at": vocab.next_review_at}
