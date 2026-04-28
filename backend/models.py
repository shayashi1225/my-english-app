from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    situation_id = Column(String(50), nullable=False)
    situation_title = Column(String(200), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_score = Column(Float, nullable=True)
    grammar_score = Column(Float, nullable=True)
    fluency_score = Column(Float, nullable=True)
    summary = Column(Text, nullable=True)

    turns = relationship("ConversationTurn", back_populates="session", cascade="all, delete-orphan")
    vocabulary = relationship("SessionVocabulary", back_populates="session", cascade="all, delete-orphan")


class ConversationTurn(Base):
    __tablename__ = "conversation_turns"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    turn_number = Column(Integer, nullable=False)
    speaker = Column(String(10), CheckConstraint("speaker IN ('ai', 'user')"), nullable=False)
    text = Column(Text, nullable=False)
    grammar_score = Column(Float, nullable=True)
    pronunciation_feedback = Column(Text, nullable=True)
    grammar_feedback = Column(Text, nullable=True)
    corrected_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="turns")


class SessionVocabulary(Base):
    __tablename__ = "session_vocabulary"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    word_or_phrase = Column(String(200), nullable=False)
    explanation = Column(Text, nullable=False)
    example_sentence = Column(Text, nullable=True)

    session = relationship("Session", back_populates="vocabulary")
