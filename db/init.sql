CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    situation_id VARCHAR(50) NOT NULL,
    situation_title VARCHAR(200) NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    total_score FLOAT,
    grammar_score FLOAT,
    fluency_score FLOAT,
    summary TEXT
);

CREATE TABLE IF NOT EXISTS conversation_turns (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    speaker VARCHAR(10) NOT NULL CHECK (speaker IN ('ai', 'user')),
    text TEXT NOT NULL,
    grammar_score FLOAT,
    pronunciation_feedback TEXT,
    grammar_feedback TEXT,
    grammar_issue_categories TEXT,
    corrected_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_vocabulary (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    word_or_phrase VARCHAR(200) NOT NULL,
    explanation TEXT NOT NULL,
    example_sentence TEXT,
    box INTEGER NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
    next_review_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMP,
    review_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_turns_session_id ON conversation_turns(session_id);
CREATE INDEX IF NOT EXISTS idx_session_vocabulary_next_review_at ON session_vocabulary(next_review_at);
