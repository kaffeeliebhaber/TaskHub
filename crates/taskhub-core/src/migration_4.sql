ALTER TABLE metadata ADD COLUMN theme TEXT NOT NULL DEFAULT 'cyberpunk'
  CHECK(theme IN ('light','dark','cyberpunk','coffee'));
PRAGMA user_version=4;
