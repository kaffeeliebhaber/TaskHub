import { TaskCard, DragAvatar, type DragPreview } from "./components/TaskCard";
import { editChecklist } from "./domain/model";
import {
  NameDialog,
  TaskInput,
  TaskEditor,
  ResizeHandle,
} from "./components/Editors";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  LayoutGrid,
  Search,
  Plus,
  Settings,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Check,
  Columns3,
  ArrowUpRight,
  Folder,
  GripVertical,
} from "lucide-react";
import { repository } from "./data/repository";
import { WorkspaceStore } from "./data/store";
import {
  addProject,
  addTask,
  id,
  moveColumn,
  moveTask,
  ordered,
  removeColumn,
  removeProject,
  type Task,
  type Workspace,
} from "./domain/model";
import { Dialog } from "./components/Dialog";
type Modal =
  | {
      kind: "name";
      title: string;
      initial: string;
      submit: (value: string) => Promise<boolean>;
    }
  | {
      kind: "delete";
      title: string;
      message: string;
      submit: () => Promise<boolean>;
    }
  | { kind: "task"; task: Task }
  | { kind: "settings" }
  | null;
export function App() {
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [store] = useState(() => new WorkspaceStore(repository));
  const {
    workspace: s,
    loading,
    pending,
    error,
  } = useSyncExternalStore(store.subscribe, store.snapshot);
  const [page, setPage] = useState<"board" | "projects" | "search">("board");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [path, setPath] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [drop, setDrop] = useState<string | null>(null);
  const drag = useRef<{ kind: "task" | "column"; id: string } | null>(null);
  useEffect(() => {
    void store.load();
    repository
      .location()
      .then(setPath)
      .catch(() => setPath("Speicherort nicht verfügbar"));
  }, []);
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      if (pending) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [pending]);
  const project = s.projects.find((p) => p.id === s.activeProjectId),
    board = s.boards.find((b) => b.projectId === project?.id);
  const columns = ordered(s.columns.filter((c) => c.boardId === board?.id));
  const change = store.change;
  const openProject = (projectId: string) => {
    void change((w) => {
      w.activeProjectId = projectId;
    });
    setPage("board");
    setQuery("");
    setAdding(null);
  };
  const nameDialog = (
    title: string,
    initial: string,
    edit: (w: Workspace, value: string) => void,
  ) =>
    setModal({
      kind: "name",
      title,
      initial,
      submit: (value) => change((w) => edit(w, value)),
    });
  const newProject = () =>
    nameDialog("Neues Projekt", "", (w, value) => {
      addProject(w, value);
      setPage("board");
      setQuery("");
    });
  const confirmDelete = (
    title: string,
    message: string,
    edit: (w: Workspace) => void,
  ) => setModal({ kind: "delete", title, message, submit: () => change(edit) });
  const matches = (t: Task) =>
    `${t.title} ${t.description}`
      .toLocaleLowerCase("de")
      .includes(query.toLocaleLowerCase("de"));
  const boardTasks = s.tasks.filter((t) =>
    columns.some((c) => c.id === t.columnId),
  );
  const onDrop = (columnId: string, beforeId?: string) => {
    const item = drag.current;
    drag.current = null;
    setDrop(null);
    if (!item) return;
    void change((w) => {
      if (item.kind === "task") moveTask(w, item.id, columnId, beforeId);
      else moveColumn(w, item.id, columnId);
    });
  };
  return (
    <div className={`shell ${dragPreview ? "is-dragging" : ""}`}>
      <DragAvatar preview={dragPreview} />
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Columns3 size={20} />
          </span>
          TaskHub<span className="version">0.1</span>
        </div>
        <div className="workspace-label">DEIN ARBEITSPLATZ</div>
        <nav aria-label="Hauptnavigation">
          <button
            className={page === "projects" ? "nav active" : "nav"}
            onClick={() => {
              setPage("projects");
              setQuery("");
            }}
          >
            <LayoutGrid size={17} />
            Projekte
          </button>
          <button
            className={page === "search" ? "nav active" : "nav"}
            onClick={() => {
              setPage("search");
              setQuery("");
            }}
          >
            <Search size={17} />
            Suche
          </button>
        </nav>
        <div className="section-label">
          <span>
            Projekte <small>{s.projects.length}</small>
          </span>
          <button aria-label="Neues Projekt" onClick={newProject}>
            <Plus size={16} />
          </button>
        </div>
        <nav className="project-list" aria-label="Projekte">
          {s.projects.map((p, i) => (
            <button
              className={
                p.id === project?.id && page === "board"
                  ? "nav active project"
                  : "nav project"
              }
              key={p.id}
              onClick={() => openProject(p.id)}
            >
              <span className={`project-dot color-${i % 4}`} />
              <span>{p.name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-status">
            <span className="status-dot" />
            {repository.preview ? "Browser-Vorschau" : "Lokal auf deinem Gerät"}
          </div>
          <button
            className="nav"
            onClick={() => setModal({ kind: "settings" })}
          >
            <Settings size={17} />
            Einstellungen
          </button>
          <div className="profile">
            <span>S</span>
            <div>
              Mein Arbeitsplatz<small>Alles an einem Ort.</small>
            </div>
          </div>
        </div>
      </aside>
      <main>
        <div className="topbar">
          <span>
            Mein Arbeitsplatz <ChevronRight size={13} />{" "}
            {page === "board"
              ? (project?.name ?? "Willkommen")
              : page === "projects"
                ? "Projekte"
                : "Suche"}
          </span>
          <span className="save-status" role="status">
            {error ? (
              "Speichern fehlgeschlagen"
            ) : pending ? (
              "Wird gespeichert …"
            ) : (
              <>
                <Check size={13} />
                {repository.preview
                  ? "Vorschau gespeichert"
                  : "Lokal gespeichert"}
              </>
            )}
          </span>
        </div>
        {error && (
          <div className="error" role="alert">
            <div>
              <strong>Änderung nicht gespeichert.</strong>
              <br />
              {error}
            </div>
            <button onClick={() => window.location.reload()}>
              Gespeicherten Stand laden
            </button>
          </div>
        )}
        {loading ? (
          <div className="empty">
            <h1>Dein Arbeitsplatz wird geladen …</h1>
          </div>
        ) : (
          <>
            <header className="page-header">
              <div className="eyebrow">
                {page === "board" ? "PROJEKTBOARD" : "MEIN ARBEITSPLATZ"}
              </div>
              <div className="title-row">
                <h1>
                  {page === "board"
                    ? (project?.name ?? "Platz für deine Projekte.")
                    : page === "projects"
                      ? "Deine Projekte"
                      : "Alles wiederfinden."}
                </h1>
                {project && page === "board" && (
                  <details className="menu">
                    <summary aria-label="Projektaktionen">
                      <MoreHorizontal size={20} />
                    </summary>
                    <div className="menu-content">
                      <button
                        onClick={() =>
                          nameDialog(
                            "Projekt umbenennen",
                            project.name,
                            (w, v) => {
                              w.projects.find(
                                (p) => p.id === project.id,
                              )!.name = v;
                            },
                          )
                        }
                      >
                        Umbenennen
                      </button>
                      <button
                        className="danger"
                        onClick={() =>
                          confirmDelete(
                            "Projekt löschen?",
                            `„${project.name}“ mit allen Spalten und ${boardTasks.length} Aufgaben dauerhaft löschen?`,
                            (w) => removeProject(w, project.id),
                          )
                        }
                      >
                        Projekt löschen
                      </button>
                    </div>
                  </details>
                )}
                <div className="spacer" />
                <button
                  className="primary"
                  disabled={!!error || loading}
                  onClick={
                    page === "board" && project && columns.length
                      ? () => {
                          setAdding(columns[0].id);
                          setQuery("");
                        }
                      : newProject
                  }
                >
                  <Plus size={16} />
                  {page === "board" && project && columns.length
                    ? "Neue Aufgabe"
                    : "Neues Projekt"}
                </button>
              </div>
              <p className="subtitle">
                {page === "board" && project
                  ? "Ein klarer Kopf beginnt mit einem guten Überblick."
                  : "Deine Ideen, Vorhaben und nächsten Schritte."}
              </p>
            </header>
            {page === "board" && project ? (
              <>
                <div className="board-toolbar">
                  <div className="board-tab">
                    <Columns3 size={16} />
                    Board <span>{boardTasks.length}</span>
                  </div>
                  <div className="spacer" />
                  <div className="search-field">
                    <Search size={15} />
                    <input
                      aria-label="Board durchsuchen"
                      placeholder="In diesem Board suchen …"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        aria-label="Suche löschen"
                        onClick={() => setQuery("")}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <span className="column-total">
                    {columns.length} / 15 Spalten
                  </span>
                </div>
                <div className="board" aria-label={`Board ${project.name}`}>
                  {columns.map((c, i) => {
                    const tasks = ordered(
                        s.tasks.filter((t) => t.columnId === c.id),
                      ),
                      visible = tasks.filter(matches);
                    return (
                      <section
                        key={c.id}
                        data-column-id={c.id}
                        className={`column ${c.collapsed ? "collapsed" : ""} ${drop === c.id ? "drop-target" : ""}`}
                        style={{ width: c.collapsed ? 52 : c.width }}
                        onDragOver={(e) => {
                          if (drag.current) {
                            e.preventDefault();
                            setDrop(c.id);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          onDrop(c.id);
                        }}
                      >
                        <header
                          className="column-header"
                          draggable={!query}
                          onDragStart={(e) => {
                            drag.current = { kind: "column", id: c.id };
                            e.dataTransfer.setData("text/plain", c.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            drag.current = null;
                            setDrop(null);
                          }}
                        >
                          <button
                            title={
                              c.collapsed
                                ? "Spalte aufklappen"
                                : "Spalte einklappen"
                            }
                            aria-label={`${c.title} ${c.collapsed ? "aufklappen" : "einklappen"}`}
                            onClick={() =>
                              void change((w) => {
                                w.columns.find(
                                  (x) => x.id === c.id,
                                )!.collapsed = !c.collapsed;
                              })
                            }
                          >
                            {c.collapsed ? (
                              <ChevronRight size={15} />
                            ) : (
                              <ChevronLeft size={15} />
                            )}
                          </button>
                          <span className={`column-indicator color-${i % 4}`} />
                          <h2>{c.title}</h2>
                          <span className="count">
                            {query ? `${visible.length}/` : ""}
                            {tasks.length}
                          </span>
                          {!c.collapsed && (
                            <details className="menu">
                              <summary aria-label={`Aktionen für ${c.title}`}>
                                <MoreHorizontal size={17} />
                              </summary>
                              <div className="menu-content">
                                <button
                                  onClick={() =>
                                    nameDialog(
                                      "Spalte umbenennen",
                                      c.title,
                                      (w, v) => {
                                        w.columns.find(
                                          (x) => x.id === c.id,
                                        )!.title = v;
                                      },
                                    )
                                  }
                                >
                                  Umbenennen
                                </button>
                                <button
                                  disabled={i === 0}
                                  onClick={() =>
                                    void change((w) =>
                                      moveColumn(w, c.id, columns[i - 1]?.id),
                                    )
                                  }
                                >
                                  Nach links
                                </button>
                                <button
                                  disabled={i === columns.length - 1}
                                  onClick={() =>
                                    void change((w) =>
                                      moveColumn(w, c.id, columns[i + 2]?.id),
                                    )
                                  }
                                >
                                  Nach rechts
                                </button>
                                <label className="width-setting">
                                  Breite: {c.width} px
                                  <input
                                    aria-label={`Breite ${c.title}`}
                                    type="range"
                                    min="220"
                                    max="600"
                                    step="10"
                                    value={c.width}
                                    onChange={(e) =>
                                      void change((w) => {
                                        w.columns.find(
                                          (x) => x.id === c.id,
                                        )!.width = Number(e.target.value);
                                      })
                                    }
                                  />
                                </label>
                                <button
                                  className="danger"
                                  onClick={() =>
                                    confirmDelete(
                                      "Spalte löschen?",
                                      `„${c.title}“ und ${tasks.length} Aufgaben dauerhaft löschen?`,
                                      (w) => removeColumn(w, c.id),
                                    )
                                  }
                                >
                                  Spalte löschen
                                </button>
                              </div>
                            </details>
                          )}
                        </header>
                        {!c.collapsed && (
                          <>
                            <div className="cards">
                              {visible.map((t) => (
                                <TaskCard
                                  key={t.id}
                                  task={t}
                                  disabled={!!query}
                                  drop={drop}
                                  preview={dragPreview}
                                  onPreview={setDragPreview}
                                  onHover={setDrop}
                                  onMove={(columnId, beforeId) =>
                                    void change((w) =>
                                      moveTask(w, t.id, columnId, beforeId),
                                    )
                                  }
                                  onOpen={() =>
                                    setModal({ kind: "task", task: t })
                                  }
                                  onChecklist={(edit) =>
                                    change((w) =>
                                      editChecklist(
                                        w.tasks.find(
                                          (task) => task.id === t.id,
                                        )!,
                                        edit,
                                      ),
                                    )
                                  }
                                />
                              ))}
                            </div>
                            {adding === c.id ? (
                              <TaskInput
                                submit={async (title) => {
                                  const ok = await change((w) =>
                                    addTask(w, c.id, title),
                                  );
                                  return ok;
                                }}
                                close={() => setAdding(null)}
                              />
                            ) : (
                              <button
                                className="add-task"
                                onClick={() => setAdding(c.id)}
                              >
                                <Plus size={15} />
                                Aufgabe hinzufügen
                              </button>
                            )}
                            {tasks.length === 0 && adding !== c.id && (
                              <div className="column-empty">
                                Raum für den nächsten Schritt.
                              </div>
                            )}
                            <ResizeHandle
                              column={c}
                              save={(width) =>
                                void change((w) => {
                                  w.columns.find((x) => x.id === c.id)!.width =
                                    width;
                                })
                              }
                            />
                          </>
                        )}
                      </section>
                    );
                  })}
                  <button
                    className="add-column"
                    disabled={columns.length >= 15}
                    onClick={() =>
                      nameDialog("Neue Spalte", "", (w, title) => {
                        w.columns.push({
                          id: id(),
                          boardId: board!.id,
                          title,
                          position:
                            Math.max(
                              -1,
                              ...w.columns
                                .filter((c) => c.boardId === board!.id)
                                .map((c) => c.position),
                            ) + 1,
                          width: 300,
                          collapsed: false,
                        });
                      })
                    }
                  >
                    <Plus size={17} />
                    Spalte hinzufügen
                  </button>
                </div>
                <footer className="board-footer">
                  {query
                    ? "Suchergebnisse · zum Sortieren die Suche leeren"
                    : "Karten und Spalten ziehen, um sie zu verschieben."}
                  <span>Dein Tempo. Dein System.</span>
                </footer>
              </>
            ) : page === "search" ? (
              <div className="overview">
                <div className="search-field large">
                  <Search size={18} />
                  <input
                    autoFocus
                    aria-label="Alle Projekte durchsuchen"
                    placeholder="Aufgaben in allen Projekten suchen …"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {query ? (
                  s.tasks.filter(matches).map((t) => {
                    const b = s.boards.find(
                      (b) =>
                        b.id ===
                        s.columns.find((c) => c.id === t.columnId)?.boardId,
                    );
                    const p = s.projects.find((p) => p.id === b?.projectId);
                    return (
                      <button
                        className="search-result"
                        key={t.id}
                        onClick={() => {
                          openProject(p!.id);
                          setModal({ kind: "task", task: t });
                        }}
                      >
                        <span>
                          {t.title}
                          <small>{p?.name}</small>
                        </span>
                        <ArrowUpRight size={18} />
                      </button>
                    );
                  })
                ) : (
                  <p className="muted">
                    Suche nach einem Titel oder einem Wort aus der Beschreibung.
                  </p>
                )}
                {query && !s.tasks.some(matches) && (
                  <p>Keine Aufgaben gefunden.</p>
                )}
              </div>
            ) : s.projects.length && page === "projects" ? (
              <div className="project-grid">
                {s.projects.map((p, i) => {
                  const b = s.boards.find((b) => b.projectId === p.id);
                  const cs = s.columns.filter((c) => c.boardId === b?.id);
                  return (
                    <button
                      className="project-tile"
                      key={p.id}
                      onClick={() => openProject(p.id)}
                    >
                      <span className={`tile-icon color-${i % 4}`}>
                        <Folder size={23} />
                      </span>
                      <ArrowUpRight size={18} />
                      <h2>{p.name}</h2>
                      <p>
                        {cs.length} Spalten ·{" "}
                        {
                          s.tasks.filter((t) =>
                            cs.some((c) => c.id === t.columnId),
                          ).length
                        }{" "}
                        Aufgaben
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="empty">
                <span className="welcome-icon">
                  <Columns3 size={32} />
                </span>
                <h2>Aus Vorhaben werden nächste Schritte.</h2>
                <p>
                  Erstelle dein erstes Projekt.
                  <br />
                  Dein Board startet mit Offen, In Arbeit und Erledigt.
                </p>
                <button className="primary" onClick={newProject}>
                  <Plus size={17} />
                  Erstes Projekt erstellen
                </button>
              </div>
            )}
          </>
        )}
      </main>
      {modal?.kind === "name" && (
        <NameDialog
          key={modal.title + modal.initial}
          title={modal.title}
          initial={modal.initial}
          submit={modal.submit}
          close={() => setModal(null)}
        />
      )}
      {modal?.kind === "delete" && (
        <Dialog title={modal.title} close={() => setModal(null)}>
          <p>{modal.message}</p>
          <p className="muted">
            Diese Aktion kann noch nicht rückgängig gemacht werden.
          </p>
          <div className="dialog-actions">
            <button onClick={() => setModal(null)}>Abbrechen</button>
            <button
              className="destructive"
              disabled={pending > 0}
              onClick={async () => {
                if (await modal.submit()) setModal(null);
              }}
            >
              Dauerhaft löschen
            </button>
          </div>
          {error && (
            <p role="alert" className="danger">
              {error}
            </p>
          )}
        </Dialog>
      )}
      {modal?.kind === "task" && (
        <TaskEditor
          task={s.tasks.find((t) => t.id === modal.task.id) ?? modal.task}
          columns={columns}
          close={() => setModal(null)}
          save={(title, description, columnId) =>
            change((w) => {
              const t = w.tasks.find((t) => t.id === modal.task.id)!;
              t.title = title;
              t.description = description;
              t.updatedAt = new Date().toISOString();
              if (t.columnId !== columnId) moveTask(w, t.id, columnId);
            })
          }
          remove={() =>
            confirmDelete(
              "Aufgabe löschen?",
              `„${modal.task.title}“ dauerhaft löschen?`,
              (w) => {
                w.tasks = w.tasks.filter((t) => t.id !== modal.task.id);
              },
            )
          }
        />
      )}
      {modal?.kind === "settings" && (
        <Dialog title="Einstellungen" close={() => setModal(null)}>
          <div className="settings-section">
            <h3>Deine Daten bleiben bei dir.</h3>
            <p>
              {repository.preview
                ? "Diese Browser-Vorschau verwendet einen eigenen Speicher. Deine Desktop-Daten werden hier nicht angezeigt."
                : "Projekte und Änderungen werden automatisch in einer lokalen SQLite-Datenbank gespeichert."}
            </p>
            <label>Speicherort</label>
            <code>{path}</code>
          </div>
          <div className="settings-section">
            <h3>TaskHub 0.1 · Erster Zwischenstand</h3>
            <p>
              Dunkles Design, Projekte, Boards, Aufgaben und erste Checklisten.
              Labels, Gruppen, Termine und Backups folgen in den nächsten
              Ausbauschritten.
            </p>
          </div>
          <button className="primary" onClick={() => setModal(null)}>
            Fertig
          </button>
        </Dialog>
      )}
    </div>
  );
}
