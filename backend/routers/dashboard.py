from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session as DBSession
from database import get_db
from models import Session, ConversationTurn, SessionVocabulary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(db: DBSession = Depends(get_db)):
    total_sessions = db.query(func.count(Session.id)).filter(
        Session.completed_at.isnot(None)
    ).scalar()

    avg_score = db.query(func.avg(Session.total_score)).filter(
        Session.completed_at.isnot(None)
    ).scalar()

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_sessions = db.query(Session).filter(
        Session.completed_at.isnot(None),
        Session.started_at >= thirty_days_ago,
    ).order_by(Session.started_at.desc()).limit(10).all()

    streak = _calculate_streak(db)

    daily_scores = (
        db.query(
            cast(Session.started_at, Date).label("date"),
            func.avg(Session.total_score).label("avg_score"),
            func.count(Session.id).label("count"),
        )
        .filter(Session.completed_at.isnot(None), Session.started_at >= thirty_days_ago)
        .group_by(cast(Session.started_at, Date))
        .order_by(cast(Session.started_at, Date))
        .all()
    )

    situation_stats = (
        db.query(
            Session.situation_title,
            func.count(Session.id).label("count"),
            func.avg(Session.total_score).label("avg_score"),
        )
        .filter(Session.completed_at.isnot(None))
        .group_by(Session.situation_title)
        .all()
    )

    return {
        "total_sessions": total_sessions or 0,
        "average_score": round(avg_score, 1) if avg_score else 0,
        "current_streak": streak,
        "recent_sessions": [
            {
                "id": s.id,
                "situation_title": s.situation_title,
                "started_at": s.started_at,
                "total_score": s.total_score,
                "grammar_score": s.grammar_score,
                "fluency_score": s.fluency_score,
            }
            for s in recent_sessions
        ],
        "daily_scores": [
            {
                "date": str(row.date),
                "avg_score": round(row.avg_score, 1) if row.avg_score else 0,
                "count": row.count,
            }
            for row in daily_scores
        ],
        "situation_stats": [
            {
                "title": row.situation_title,
                "count": row.count,
                "avg_score": round(row.avg_score, 1) if row.avg_score else 0,
            }
            for row in situation_stats
        ],
    }


def _calculate_streak(db: DBSession) -> int:
    today = datetime.utcnow().date()
    streak = 0
    check_date = today

    while True:
        count = db.query(func.count(Session.id)).filter(
            Session.completed_at.isnot(None),
            cast(Session.started_at, Date) == check_date,
        ).scalar()

        if count == 0:
            break
        streak += 1
        check_date -= timedelta(days=1)

    return streak
