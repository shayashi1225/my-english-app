from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession
from database import get_db
from models import Session, ConversationTurn, SessionVocabulary
from services import claude_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class StartSessionRequest(BaseModel):
    situation_id: str


class UserTurnRequest(BaseModel):
    user_text: str


@router.post("")
def start_session(req: StartSessionRequest, db: DBSession = Depends(get_db)):
    situations = claude_service.get_situations()
    situation = next((s for s in situations if s["id"] == req.situation_id), None)
    if not situation:
        raise HTTPException(status_code=404, detail="Situation not found")

    result = claude_service.start_conversation(req.situation_id)

    session = Session(
        situation_id=req.situation_id,
        situation_title=situation["title"],
    )
    db.add(session)
    db.flush()

    turn = ConversationTurn(
        session_id=session.id,
        turn_number=1,
        speaker="ai",
        text=result["ai_message"],
    )
    db.add(turn)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "situation": situation,
        "ai_message": result["ai_message"],
    }


@router.post("/{session_id}/turn")
def add_turn(session_id: int, req: UserTurnRequest, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.completed_at:
        raise HTTPException(status_code=400, detail="Session already completed")

    turns = db.query(ConversationTurn).filter(
        ConversationTurn.session_id == session_id
    ).order_by(ConversationTurn.turn_number).all()

    history = [{"speaker": t.speaker, "text": t.text} for t in turns]
    turn_number = len(turns) + 1

    user_turn = ConversationTurn(
        session_id=session_id,
        turn_number=turn_number,
        speaker="user",
        text=req.user_text,
    )
    db.add(user_turn)
    db.flush()

    result = claude_service.continue_conversation(session.situation_id, history, req.user_text)
    feedback = result.get("feedback") or {}

    user_turn.grammar_score = feedback.get("grammar_score")
    user_turn.grammar_feedback = "; ".join(feedback.get("grammar_issues", []))
    user_turn.corrected_text = feedback.get("corrected_text")
    user_turn.pronunciation_feedback = "; ".join(feedback.get("pronunciation_tips", []))

    ai_turn = ConversationTurn(
        session_id=session_id,
        turn_number=turn_number + 1,
        speaker="ai",
        text=result["ai_message"],
    )
    db.add(ai_turn)
    db.commit()

    return {
        "ai_message": result["ai_message"],
        "feedback": feedback,
        "is_last_turn": result.get("is_last_turn", False),
    }


@router.post("/{session_id}/complete")
def complete_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    turns = db.query(ConversationTurn).filter(
        ConversationTurn.session_id == session_id
    ).order_by(ConversationTurn.turn_number).all()

    history = [{"speaker": t.speaker, "text": t.text} for t in turns]
    summary_data = claude_service.generate_session_summary(session.situation_id, history)

    session.completed_at = datetime.utcnow()
    session.total_score = summary_data.get("total_score")
    session.grammar_score = summary_data.get("grammar_score")
    session.fluency_score = summary_data.get("fluency_score")
    session.summary = summary_data.get("overall_summary")

    for vocab in summary_data.get("vocabulary", []):
        item = SessionVocabulary(
            session_id=session_id,
            word_or_phrase=vocab["word_or_phrase"],
            explanation=vocab["explanation"],
            example_sentence=vocab.get("example_sentence"),
        )
        db.add(item)

    db.commit()
    db.refresh(session)

    vocab_items = db.query(SessionVocabulary).filter(
        SessionVocabulary.session_id == session_id
    ).all()

    return {
        "summary": summary_data,
        "vocabulary": [
            {
                "word_or_phrase": v.word_or_phrase,
                "explanation": v.explanation,
                "example_sentence": v.example_sentence,
            }
            for v in vocab_items
        ],
    }


@router.get("/{session_id}")
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    turns = db.query(ConversationTurn).filter(
        ConversationTurn.session_id == session_id
    ).order_by(ConversationTurn.turn_number).all()

    return {
        "id": session.id,
        "situation_id": session.situation_id,
        "situation_title": session.situation_title,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
        "total_score": session.total_score,
        "grammar_score": session.grammar_score,
        "fluency_score": session.fluency_score,
        "summary": session.summary,
        "turns": [
            {
                "speaker": t.speaker,
                "text": t.text,
                "grammar_score": t.grammar_score,
                "grammar_feedback": t.grammar_feedback,
                "corrected_text": t.corrected_text,
                "pronunciation_feedback": t.pronunciation_feedback,
            }
            for t in turns
        ],
    }
