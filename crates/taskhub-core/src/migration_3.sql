ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'none' CHECK(priority IN ('none','low','medium','high','critical'));
ALTER TABLE metadata ADD COLUMN sidebar_collapsed INTEGER NOT NULL DEFAULT 0 CHECK(sidebar_collapsed IN (0,1));
ALTER TABLE metadata ADD COLUMN focus_state TEXT;
CREATE TABLE focus_notes (
 id TEXT PRIMARY KEY,
 session_id TEXT NOT NULL,
 task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
 task_title TEXT NOT NULL,
 text TEXT NOT NULL CHECK(length(trim(text)) BETWEEN 1 AND 10000),
 created_at TEXT NOT NULL
);
CREATE INDEX focus_notes_task ON focus_notes(task_id,created_at);
PRAGMA user_version=3;
