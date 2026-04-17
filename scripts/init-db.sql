-- HiveBodyLog — run this once in your Neon console

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  email TEXT,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magic_links (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  structured JSONB,
  summary TEXT,
  follow_up TEXT,
  tags JSONB DEFAULT '[]',
  intensity INTEGER CHECK (intensity >= 0 AND intensity <= 10),
  time_of_day TEXT,
  supplement_image TEXT,
  supplement_assessment JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  claude_summary TEXT,
  structured JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS entries_session_created ON entries (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS uploads_session_created ON uploads (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS magic_links_token ON magic_links (token);
CREATE INDEX IF NOT EXISTS sessions_email ON sessions (email);
