CREATE TABLE IF NOT EXISTS metadata (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 0, active_project_id TEXT);
INSERT OR IGNORE INTO metadata(id) VALUES(1);
CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120), created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS boards (id TEXT PRIMARY KEY, project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS columns (id TEXT PRIMARY KEY, board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE, title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120), position INTEGER NOT NULL CHECK(position>=0), width INTEGER NOT NULL CHECK(width BETWEEN 220 AND 600), collapsed INTEGER NOT NULL CHECK(collapsed IN (0,1)));
CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, column_id TEXT NOT NULL REFERENCES columns(id) ON DELETE CASCADE, title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 300), description TEXT NOT NULL, position INTEGER NOT NULL CHECK(position>=0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS columns_board ON columns(board_id, position);
CREATE INDEX IF NOT EXISTS tasks_column ON tasks(column_id, position);
PRAGMA user_version=1;
