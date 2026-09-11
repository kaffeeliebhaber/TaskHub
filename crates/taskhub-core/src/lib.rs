use rusqlite::{params, Connection, TransactionBehavior};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, path::Path};
fn default_priority() -> String {
    "none".into()
}
fn default_theme() -> String {
    "cyberpunk".into()
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FocusSession {
    pub id: String,
    pub task_id: Option<String>,
    pub task_title: String,
    pub duration_ms: u64,
    pub remaining_ms: u64,
    pub end_at: Option<u64>,
    pub status: String,
    pub created_at: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FocusNote {
    pub id: String,
    pub session_id: String,
    pub task_id: Option<String>,
    pub task_title: String,
    pub text: String,
    pub created_at: String,
}
pub type Result<T> = std::result::Result<T, String>;
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChecklistItem {
    pub id: String,
    pub text: String,
    pub done: bool,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Checklist {
    pub title: String,
    pub collapsed: bool,
    pub items: Vec<ChecklistItem>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub created_at: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Board {
    pub id: String,
    pub project_id: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Column {
    pub id: String,
    pub board_id: String,
    pub title: String,
    pub position: u32,
    pub width: u32,
    pub collapsed: bool,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Task {
    #[serde(default = "default_priority")]
    pub priority: String,
    #[serde(default)]
    pub checklist: Option<Checklist>,
    pub id: String,
    pub column_id: String,
    pub title: String,
    pub description: String,
    pub position: u32,
    pub created_at: String,
    pub updated_at: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Workspace {
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default)]
    pub sidebar_collapsed: bool,
    #[serde(default)]
    pub focus: Option<FocusSession>,
    #[serde(default)]
    pub focus_notes: Vec<FocusNote>,
    pub revision: u64,
    pub active_project_id: Option<String>,
    pub projects: Vec<Project>,
    pub boards: Vec<Board>,
    pub columns: Vec<Column>,
    pub tasks: Vec<Task>,
}
pub struct Database {
    conn: Connection,
}
fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}
fn valid_text(s: &str, max: usize) -> bool {
    !s.trim().is_empty() && s.chars().count() <= max
}
fn ids<'a>(iter: impl Iterator<Item = &'a str>) -> Result<HashSet<&'a str>> {
    let mut result = HashSet::new();
    for id in iter {
        if id.is_empty() || id.len() > 128 || !result.insert(id) {
            return Err("Ungültige oder doppelte ID.".into());
        }
    }
    Ok(result)
}
impl Workspace {
    pub fn validate(&self) -> Result<()> {
        if !["light", "dark", "cyberpunk", "coffee"].contains(&self.theme.as_str()) {
            return Err("Ungültiges Theme.".into());
        }
        let exists = |id: &Option<String>| {
            id.as_ref()
                .is_none_or(|id| self.tasks.iter().any(|t| &t.id == id))
        };
        if self
            .tasks
            .iter()
            .any(|t| !["none", "low", "medium", "high", "critical"].contains(&t.priority.as_str()))
        {
            return Err("Ungültige Priorität.".into());
        }
        ids(self.focus_notes.iter().map(|n| n.id.as_str()))?;
        if self.focus_notes.iter().any(|n| {
            !exists(&n.task_id)
                || !valid_text(&n.session_id, 128)
                || !valid_text(&n.text, 10000)
                || n.task_title.chars().count() > 300
                || !valid_text(&n.created_at, 64)
        }) {
            return Err("Ungültige Focus-Notiz.".into());
        }
        if let Some(f) = &self.focus {
            if !valid_text(&f.id, 128)
                || !exists(&f.task_id)
                || f.task_title.chars().count() > 300
                || !(60000..=14400000).contains(&f.duration_ms)
                || f.remaining_ms > f.duration_ms
                || !["running", "paused", "completed", "stopped"].contains(&f.status.as_str())
                || (if f.status == "running" {
                    f.end_at
                        .is_none_or(|end| end == 0 || end > 9007199254740991)
                } else {
                    f.end_at.is_some()
                })
                || (f.status == "completed" && f.remaining_ms != 0)
            {
                return Err("Ungültige Focus-Zeit.".into());
            }
        }
        for task in &self.tasks {
            if let Some(list) = &task.checklist {
                ids(list.items.iter().map(|item| item.id.as_str()))?;
                if !valid_text(&list.title, 120)
                    || list.items.len() > 200
                    || list.items.iter().any(|item| !valid_text(&item.text, 300))
                {
                    return Err("Ungültige Checkliste.".into());
                }
            }
        }
        let projects = ids(self.projects.iter().map(|p| p.id.as_str()))?;
        let boards = ids(self.boards.iter().map(|b| b.id.as_str()))?;
        let columns = ids(self.columns.iter().map(|c| c.id.as_str()))?;
        ids(self.tasks.iter().map(|t| t.id.as_str()))?;
        if self.projects.iter().any(|p| {
            !valid_text(&p.name, 120)
                || self.boards.iter().filter(|b| b.project_id == p.id).count() != 1
        }) || self.boards.iter().any(|b| {
            !projects.contains(b.project_id.as_str())
                || self.columns.iter().filter(|c| c.board_id == b.id).count() > 15
        }) || self.columns.iter().any(|c| {
            !boards.contains(c.board_id.as_str())
                || !valid_text(&c.title, 120)
                || !(220..=600).contains(&c.width)
        }) || self.tasks.iter().any(|t| {
            !columns.contains(t.column_id.as_str())
                || !valid_text(&t.title, 300)
                || t.description.chars().count() > 100000
        }) || self
            .active_project_id
            .as_ref()
            .is_some_and(|id| !projects.contains(id.as_str()))
        {
            return Err("Ungültige Projektdaten (Namen, Zuordnung oder Spaltenlimit).".into());
        }
        Ok(())
    }
}
impl Database {
    pub fn open(path: &Path) -> Result<Self> {
        let conn = Connection::open(path).map_err(err)?;
        conn.busy_timeout(std::time::Duration::from_secs(5))
            .map_err(err)?;
        conn.execute_batch("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;")
            .map_err(err)?;
        let version: u32 = conn
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .map_err(err)?;
        if version > 4 {
            return Err("Diese Datenbank benötigt eine neuere TaskHub-Version.".into());
        }
        if version > 0 && version < 4 && path != Path::new(":memory:") {
            let stamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(err)?
                .as_nanos();
            let backup = path.with_file_name(format!(
                "{}.before-v4-{stamp}.bak",
                path.file_name().unwrap_or_default().to_string_lossy()
            ));
            conn.execute("VACUUM INTO ?1", [backup.to_string_lossy().as_ref()])
                .map_err(err)?;
        }
        if version == 0 {
            conn.execute_batch(&format!(
                "BEGIN IMMEDIATE; {} COMMIT;",
                include_str!("schema.sql")
            ))
            .map_err(err)?;
        }
        if version < 2 {
            conn.execute_batch("BEGIN IMMEDIATE; ALTER TABLE tasks ADD COLUMN checklist TEXT; PRAGMA user_version=2; COMMIT;").map_err(err)?;
        }
        if version < 3 {
            conn.execute_batch(&format!(
                "BEGIN IMMEDIATE; {} COMMIT;",
                include_str!("migration_3.sql")
            ))
            .map_err(err)?;
        }
        if version < 4 {
            conn.execute_batch(&format!(
                "BEGIN IMMEDIATE; {} COMMIT;",
                include_str!("migration_4.sql")
            ))
            .map_err(err)?;
        }
        Ok(Self { conn })
    }
    pub fn load(&mut self) -> Result<Workspace> {
        let tx = self.conn.transaction().map_err(err)?;
        let (revision, active_project_id,sidebar_collapsed,focus_json,theme): (u64,Option<String>,bool,Option<String>,String) = tx
            .query_row(
                "SELECT revision,active_project_id,sidebar_collapsed,focus_state,theme FROM metadata WHERE id=1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?)),
            )
            .map_err(err)?;
        macro_rules! read {
            ($sql:expr,$f:expr) => {{
                let mut st = tx.prepare($sql).map_err(err)?;
                let rows = st.query_map([], $f).map_err(err)?;
                rows.collect::<std::result::Result<Vec<_>, _>>()
                    .map_err(err)?
            }};
        }
        let projects = read!(
            "SELECT id,name,created_at FROM projects ORDER BY created_at,id",
            |r| Ok(Project {
                id: r.get(0)?,
                name: r.get(1)?,
                created_at: r.get(2)?
            })
        );
        let boards = read!("SELECT id,project_id FROM boards", |r| Ok(Board {
            id: r.get(0)?,
            project_id: r.get(1)?
        }));
        let columns = read!(
            "SELECT id,board_id,title,position,width,collapsed FROM columns ORDER BY position,id",
            |r| Ok(Column {
                id: r.get(0)?,
                board_id: r.get(1)?,
                title: r.get(2)?,
                position: r.get(3)?,
                width: r.get(4)?,
                collapsed: r.get(5)?
            })
        );
        let tasks=read!("SELECT id,column_id,title,description,position,created_at,updated_at,checklist,priority FROM tasks ORDER BY position,id",|r|Ok(Task{priority:r.get(8)?,checklist: r.get::<_,Option<String>>(7)?.map(|json|serde_json::from_str(&json).map_err(|e|rusqlite::Error::FromSqlConversionFailure(7,rusqlite::types::Type::Text,Box::new(e)))).transpose()?,id:r.get(0)?,column_id:r.get(1)?,title:r.get(2)?,description:r.get(3)?,position:r.get(4)?,created_at:r.get(5)?,updated_at:r.get(6)?}));
        let focus = focus_json
            .map(|json| serde_json::from_str(&json).map_err(err))
            .transpose()?;
        let focus_notes=read!("SELECT id,session_id,task_id,task_title,text,created_at FROM focus_notes ORDER BY created_at,id",|r|Ok(FocusNote{id:r.get(0)?,session_id:r.get(1)?,task_id:r.get(2)?,task_title:r.get(3)?,text:r.get(4)?,created_at:r.get(5)?}));
        tx.commit().map_err(err)?;
        Ok(Workspace {
            theme,
            sidebar_collapsed,
            focus,
            focus_notes,
            revision,
            active_project_id,
            projects,
            boards,
            columns,
            tasks,
        })
    }
    pub fn save(&mut self, state: &Workspace) -> Result<u64> {
        state.validate()?;
        let tx = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)
            .map_err(err)?;
        let revision: u64 = tx
            .query_row("SELECT revision FROM metadata WHERE id=1", [], |r| r.get(0))
            .map_err(err)?;
        if revision != state.revision {
            return Err(
                "Die Daten wurden in einem anderen Fenster geändert. Bitte neu laden.".into(),
            );
        }
        // Upsert preserves identities and future child tables. Never replace parent rows.
        for p in &state.projects {
            tx.execute("INSERT INTO projects VALUES(?1,?2,?3) ON CONFLICT(id) DO UPDATE SET name=excluded.name",params![p.id,p.name,p.created_at]).map_err(err)?;
        }
        for b in &state.boards {
            tx.execute("INSERT INTO boards VALUES(?1,?2) ON CONFLICT(id) DO UPDATE SET project_id=excluded.project_id",params![b.id,b.project_id]).map_err(err)?;
        }
        for c in &state.columns {
            tx.execute("INSERT INTO columns VALUES(?1,?2,?3,?4,?5,?6) ON CONFLICT(id) DO UPDATE SET board_id=excluded.board_id,title=excluded.title,position=excluded.position,width=excluded.width,collapsed=excluded.collapsed",params![c.id,c.board_id,c.title,c.position,c.width,c.collapsed]).map_err(err)?;
        }
        for t in &state.tasks {
            tx.execute("INSERT INTO tasks (id,column_id,title,description,position,created_at,updated_at,checklist,priority) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9) ON CONFLICT(id) DO UPDATE SET column_id=excluded.column_id,title=excluded.title,description=excluded.description,position=excluded.position,updated_at=excluded.updated_at,checklist=excluded.checklist,priority=excluded.priority",params![t.id,t.column_id,t.title,t.description,t.position,t.created_at,t.updated_at,t.checklist.as_ref().map(serde_json::to_string).transpose().map_err(err)?,t.priority]).map_err(err)?;
        }
        for n in &state.focus_notes {
            tx.execute("INSERT INTO focus_notes VALUES(?1,?2,?3,?4,?5,?6) ON CONFLICT(id) DO UPDATE SET task_id=excluded.task_id,task_title=excluded.task_title,text=excluded.text",params![n.id,n.session_id,n.task_id,n.task_title,n.text,n.created_at]).map_err(err)?;
        }
        for (table, keep) in [
            (
                "focus_notes",
                state
                    .focus_notes
                    .iter()
                    .map(|n| n.id.as_str())
                    .collect::<HashSet<_>>(),
            ),
            (
                "tasks",
                state
                    .tasks
                    .iter()
                    .map(|x| x.id.as_str())
                    .collect::<HashSet<_>>(),
            ),
            (
                "columns",
                state.columns.iter().map(|x| x.id.as_str()).collect(),
            ),
            (
                "boards",
                state.boards.iter().map(|x| x.id.as_str()).collect(),
            ),
            (
                "projects",
                state.projects.iter().map(|x| x.id.as_str()).collect(),
            ),
        ] {
            let existing: Vec<String> = tx
                .prepare(&format!("SELECT id FROM {table}"))
                .map_err(err)?
                .query_map([], |r| r.get(0))
                .map_err(err)?
                .collect::<std::result::Result<_, _>>()
                .map_err(err)?;
            for id in existing {
                if !keep.contains(id.as_str()) {
                    tx.execute(&format!("DELETE FROM {table} WHERE id=?1"), [id])
                        .map_err(err)?;
                }
            }
        }
        let next = revision + 1;
        tx.execute(
            "UPDATE metadata SET revision=?1,active_project_id=?2,sidebar_collapsed=?3,focus_state=?4,theme=?5 WHERE id=1",
            params![next, state.active_project_id,state.sidebar_collapsed,state.focus.as_ref().map(serde_json::to_string).transpose().map_err(err)?,state.theme],
        )
        .map_err(err)?;
        tx.commit().map_err(err)?;
        Ok(next)
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn sample() -> Workspace {
        Workspace {
            theme: "cyberpunk".into(),
            sidebar_collapsed: false,
            focus: None,
            focus_notes: vec![],
            revision: 0,
            active_project_id: Some("p".into()),
            projects: vec![Project {
                id: "p".into(),
                name: "Haushalt".into(),
                created_at: "now".into(),
            }],
            boards: vec![Board {
                id: "b".into(),
                project_id: "p".into(),
            }],
            columns: vec![Column {
                id: "c".into(),
                board_id: "b".into(),
                title: "Offen".into(),
                position: 0,
                width: 340,
                collapsed: true,
            }],
            tasks: vec![Task {
                priority: "none".into(),
                checklist: None,
                id: "t".into(),
                column_id: "c".into(),
                title: "Küche".into(),
                description: "Farbe".into(),
                position: 0,
                created_at: "now".into(),
                updated_at: "now".into(),
            }],
        }
    }
    #[test]
    fn roundtrip_restart_and_delete() {
        let path = std::env::temp_dir().join(format!(
            "taskhub-{}-{}.db",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        {
            let mut db = Database::open(&path).unwrap();
            assert_eq!(db.save(&sample()).unwrap(), 1);
        }
        {
            let mut db = Database::open(&path).unwrap();
            let mut s = db.load().unwrap();
            assert_eq!(s.tasks[0].title, "Küche");
            assert_eq!(s.columns[0].width, 340);
            assert!(s.columns[0].collapsed);
            assert_eq!(s.active_project_id.as_deref(), Some("p"));
            s.tasks.clear();
            s.columns.clear();
            s.boards.clear();
            s.projects.clear();
            s.active_project_id = None;
            db.save(&s).unwrap();
            assert!(db.load().unwrap().tasks.is_empty());
        }
        std::fs::remove_file(path).unwrap();
    }
    #[test]
    fn rejects_stale_and_invalid_without_data_loss() {
        let mut db = Database::open(Path::new(":memory:")).unwrap();
        let mut s = sample();
        s.revision = db.save(&s).unwrap();
        assert!(db.save(&sample()).is_err());
        s.tasks[0].column_id = "missing".into();
        assert!(db.save(&s).is_err());
        assert_eq!(db.load().unwrap().tasks[0].column_id, "c");
        let mut s = db.load().unwrap();
        s.columns[0].width = 601;
        assert!(db.save(&s).is_err());
    }
    #[test]
    fn preserves_extension_children_on_update() {
        let mut db = Database::open(Path::new(":memory:")).unwrap();
        let mut s = sample();
        s.revision = db.save(&s).unwrap();
        db.conn.execute_batch("CREATE TABLE labels(task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE); INSERT INTO labels VALUES('t');").unwrap();
        s.tasks[0].title = "Neu".into();
        db.save(&s).unwrap();
        assert_eq!(
            db.conn
                .query_row("SELECT count(*) FROM labels", [], |r| r.get::<_, i32>(0))
                .unwrap(),
            1
        );
    }
    #[test]
    fn rejects_sixteen_columns() {
        let mut s = sample();
        for i in 1..16 {
            let mut c = s.columns[0].clone();
            c.id = format!("c{i}");
            s.columns.push(c);
        }
        assert!(s.validate().is_err());
    }
    #[test]
    fn migrates_v1_and_persists_checklist_after_restart() {
        let path = std::env::temp_dir().join(format!(
            "taskhub-migrate-{}.db",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        {
            let conn = Connection::open(&path).unwrap();
            conn.execute_batch(include_str!("schema.sql")).unwrap();
            conn.execute_batch("INSERT INTO projects VALUES('p','Haushalt','now'); INSERT INTO boards VALUES('b','p'); INSERT INTO columns VALUES('c','b','Offen',0,300,0); INSERT INTO tasks VALUES('t','c','Küche','Farbe',0,'now','now');").unwrap();
        }
        {
            let mut db = Database::open(&path).unwrap();
            let mut s = db.load().unwrap();
            assert_eq!(s.tasks[0].title, "Küche");
            assert!(s.tasks[0].checklist.is_none());
            s.tasks[0].checklist = Some(Checklist {
                title: "Material".into(),
                collapsed: true,
                items: vec![ChecklistItem {
                    id: "item".into(),
                    text: "Pinsel".into(),
                    done: true,
                }],
            });
            db.save(&s).unwrap();
        }
        {
            let mut db = Database::open(&path).unwrap();
            let s = db.load().unwrap();
            let list = s.tasks[0].checklist.as_ref().unwrap();
            assert!(list.collapsed);
            assert!(list.items[0].done);
            assert_eq!(list.items[0].text, "Pinsel");
            assert_eq!(
                db.conn
                    .query_row("PRAGMA user_version", [], |r| r.get::<_, u32>(0))
                    .unwrap(),
                4
            );
        }
        std::fs::remove_file(path).unwrap();
    }
    #[test]
    fn persists_focus_priority_notes_and_sidebar() {
        let mut db = Database::open(Path::new(":memory:")).unwrap();
        let mut s = sample();
        s.theme = "coffee".into();
        s.sidebar_collapsed = true;
        s.tasks[0].priority = "high".into();
        s.focus = Some(FocusSession {
            id: "f".into(),
            task_id: Some("t".into()),
            task_title: "Küche".into(),
            duration_ms: 60000,
            remaining_ms: 60000,
            end_at: Some(120000),
            status: "running".into(),
            created_at: "now".into(),
        });
        s.focus_notes.push(FocusNote {
            id: "n".into(),
            session_id: "f".into(),
            task_id: Some("t".into()),
            task_title: "Küche".into(),
            text: "Weiter planen".into(),
            created_at: "now".into(),
        });
        db.save(&s).unwrap();
        let mut loaded = db.load().unwrap();
        assert!(loaded.sidebar_collapsed);
        assert_eq!(loaded.tasks[0].priority, "high");
        assert_eq!(loaded.focus.as_ref().unwrap().end_at, Some(120000));
        assert_eq!(loaded.focus_notes[0].text, "Weiter planen");
        assert_eq!(loaded.theme, "coffee");
        loaded.tasks.clear();
        loaded.focus.as_mut().unwrap().task_id = None;
        loaded.focus_notes[0].task_id = None;
        db.save(&loaded).unwrap();
        assert_eq!(db.load().unwrap().focus_notes.len(), 1);
    }

    #[test]
    fn backs_up_v2_before_migration() {
        let dir = std::env::temp_dir().join(format!(
            "taskhub-backup-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&dir).unwrap();
        let path = dir.join("taskhub.db");
        {
            let conn = Connection::open(&path).unwrap();
            conn.execute_batch(include_str!("schema.sql")).unwrap();
            conn.execute_batch(
                "ALTER TABLE tasks ADD COLUMN checklist TEXT; PRAGMA user_version=2;",
            )
            .unwrap();
        }
        drop(Database::open(&path).unwrap());
        let backup = std::fs::read_dir(&dir)
            .unwrap()
            .map(|e| e.unwrap().path())
            .find(|p| p.extension().is_some_and(|e| e == "bak"))
            .unwrap();
        let conn = Connection::open(backup).unwrap();
        let version: u32 = conn
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .unwrap();
        assert_eq!(version, 2);
        drop(conn);
        std::fs::remove_dir_all(dir).unwrap();
    }
}
