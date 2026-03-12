-- ============================================================
-- LivePulse — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
  id         BIGSERIAL   PRIMARY KEY,
  code       TEXT        UNIQUE NOT NULL,
  title      TEXT        NOT NULL,
  host_name  TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active  BOOLEAN     DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS questions (
  id          BIGSERIAL   PRIMARY KEY,
  session_id  BIGINT      NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  text        TEXT        NOT NULL,
  author_name TEXT        NOT NULL,
  vote_count  INTEGER     DEFAULT 0,
  is_answered BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS questions_session_id_idx ON questions(session_id);
CREATE INDEX IF NOT EXISTS questions_vote_count_idx  ON questions(vote_count DESC);

CREATE TABLE IF NOT EXISTS question_voters (
  id          BIGSERIAL PRIMARY KEY,
  question_id BIGINT    NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  voter_id    TEXT      NOT NULL,
  UNIQUE(question_id, voter_id)
);

CREATE TABLE IF NOT EXISTS polls (
  id         BIGSERIAL   PRIMARY KEY,
  session_id BIGINT      NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  type       TEXT        NOT NULL CHECK(type IN ('multiple_choice', 'word_cloud', 'rating')),
  is_active  BOOLEAN     DEFAULT FALSE,
  is_closed  BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS polls_session_id_idx ON polls(session_id);

CREATE TABLE IF NOT EXISTS poll_options (
  id          BIGSERIAL PRIMARY KEY,
  poll_id     BIGINT    NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text        TEXT      NOT NULL,
  order_index INTEGER   NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_responses (
  id            BIGSERIAL   PRIMARY KEY,
  poll_id       BIGINT      NOT NULL REFERENCES polls(id)        ON DELETE CASCADE,
  respondent_id TEXT        NOT NULL,
  option_id     BIGINT               REFERENCES poll_options(id) ON DELETE SET NULL,
  text_response TEXT,
  rating_value  INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS poll_responses_poll_id_idx ON poll_responses(poll_id);

-- ============================================================
-- Optional: Row Level Security (RLS)
-- The backend uses the service role key which bypasses RLS.
-- Uncomment the lines below only if you need direct client access.
-- ============================================================
-- ALTER TABLE sessions  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE polls     ENABLE ROW LEVEL SECURITY;
