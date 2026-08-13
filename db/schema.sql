-- Cultural Compass — schema. Idempotent; safe to run more than once.
-- Postgres 13+ (gen_random_uuid is built in).

CREATE TABLE IF NOT EXISTS sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text UNIQUE NOT NULL,
  secret     text NOT NULL,
  title      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at  timestamptz
);

CREATE TABLE IF NOT EXISTS responses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  label      text,
  answers    jsonb NOT NULL,
  today_x    real NOT NULL,
  today_y    real NOT NULL,
  target_x   real NOT NULL,
  target_y   real NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS responses_session_created_idx
  ON responses (session_id, created_at);

-- Editable wording only. Item ids, axis and flip live in code because they
-- drive the scoring; nothing here can change a coordinate.
CREATE TABLE IF NOT EXISTS item_texts (
  id         int PRIMARY KEY,
  theme      text NOT NULL,
  stem       text NOT NULL,
  low        text NOT NULL,
  high       text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
