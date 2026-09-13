import { exportCanvas } from "./data/external";
import { Archive } from "./components/Archive";
import { boardCanvas } from "./domain/taskTools";
import { Sidebar } from "./components/Sidebar";
import { PriorityFilter, PriorityBadge } from "./components/Priority";
import { FocusButton, FocusTimer } from "./components/FocusTimer";
import { useFocus } from "./hooks/useFocus";
import { notesForTask } from "./domain/focus";
import { matchesTask, type Priority } from "./domain/model";
import { TaskCard, DragAvatar, type DragPreview } from "./components/TaskCard";
import {
  ColumnDragAvatar,
  DraggableColumnHeader,
  type ColumnDragPreview,
} from "./components/ColumnDrag";
import { editChecklist } from "./domain/model";
import {
  NameDialog,
  TaskInput,
  TaskEditor,
  ResizeHandle,
} from "./components/Editors";
import { useEffect, useState, useSyncExternalStore } from "react";
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
  themeNames,
  themes,
  cardFeatureNames,
  featureEnabled,
  type CardFeature,
  type Task,
  type Workspace,
} from "./domain/model";
import { Dialog } from "./components/Dialog";
import { setLanguage, tr } from "./i18n";
import { Members, Profile } from "./components/Account";
import type { User } from "./data/account";
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
export function App({user,setUser}:{user:User;setUser:(u:User|null)=>void}) {
  const [membersOpen,setMembersOpen]=useState(false),[profileOpen,setProfileOpen]=useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [columnDragPreview, setColumnDragPreview] =
    useState<ColumnDragPreview | null>(null);
  const [store] = useState(() => new WorkspaceStore(repository));
  const {
    workspace: s,
    loading,
    pending,
    error,
  } = useSyncExternalStore(store.subscribe, store.snapshot);
  useEffect(() => { setLanguage(s.language ?? "de"); }, [s.language]);
  const [page, setPage] = useState<"board" | "projects" | "search">("board");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const focus = useFocus(s, store.change, error);
  const [modal, setModal] = useState<Modal>(null);
  const [settingsTab, setSettingsTab] = useState<"general" | "themes" | "cards" | "timer">("general");
  const [path, setPath] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [drop, setDrop] = useState<string | null>(null);
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
    setPriorityFilter("all");
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
    !t.details?.archivedAt &&
    matchesTask(t, query, priorityFilter, s.focusNotes);
  const filtering = !!query.trim() || priorityFilter !== "all";
  const boardTasks = s.tasks.filter(
    (t) => !t.details?.archivedAt && columns.some((c) => c.id === t.columnId),
  );
  return (
    <div
      className={`shell ${dragPreview || columnDragPreview ? "is-dragging" : ""}`}
      data-theme={s.theme ?? "cyberpunk"}
    >
      <DragAvatar preview={dragPreview} />
      <ColumnDragAvatar preview={columnDragPreview} />
      <Sidebar
        collapsed={!!s.sidebarCollapsed}
        toggle={() =>
          void change((w) => {
            w.sidebarCollapsed = !w.sidebarCollapsed;
          })
        }
        projects={s.projects}
        activeId={project?.id}
        page={page}
        navigate={(page) => {
          setPage(page);
          setQuery("");
          setPriorityFilter("all");
        }}
        openProject={openProject}
        newProject={newProject}
        settings={() => setModal({ kind: "settings" })}
        archive={() => setArchiveOpen(true)}
        profile={() => setProfileOpen(true)}
        user={user}
        preview={repository.preview}
      />

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
                            `„${project.name}“ mit allen Spalten und ${s.tasks.filter((t) => columns.some((c) => c.id === t.columnId)).length} Aufgaben einschließlich Archiv dauerhaft löschen?`,
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
                <FocusButton controller={focus} workspace={s} />
                {board && (
                  <>
                    <button onClick={() => setMembersOpen(true)}>{tr("Mitglieder")}</button>
                    <button onClick={() => setArchiveOpen(true)}>{tr("Archiv")}</button>
                    <button
                      onClick={() => {
                        void exportCanvas(boardCanvas(s, board.id))
                          .then((message) => window.alert(message))
                          .catch((error) => window.alert(String(error)));
                      }}
                    >
                      {tr("Obsidian exportieren")}
                    </button>
                  </>
                )}
                {(!project || page !== "board") && (
                  <button
                    className="primary"
                    disabled={!!error || loading}
                    onClick={newProject}
                  >
                    <Plus size={16} />
                    Neues Projekt
                  </button>
                )}
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
                  <PriorityFilter
                    value={priorityFilter}
                    onChange={setPriorityFilter}
                  />
                  {filtering && (
                    <button
                      className="clear-filters"
                      onClick={() => {
                        setQuery("");
                        setPriorityFilter("all");
                      }}
                    >
                      Zurücksetzen
                    </button>
                  )}
                  <span className="column-total">
                    {columns.length} / 15 Spalten
                  </span>
                </div>
                <div className="board" aria-label={`Board ${project.name}`}>
                  {columns.map((c, i) => {
                    const tasks = ordered(
                        s.tasks.filter(
                          (t) => t.columnId === c.id && !t.details?.archivedAt,
                        ),
                      ),
                      visible = tasks.filter(matches);
                    return (
                      <section
                        key={c.id}
                        data-column-id={c.id}
                        className={`column ${c.collapsed ? "collapsed" : ""} ${drop === c.id ? "drop-target" : ""} ${columnDragPreview?.column.id === c.id ? "column-drag-source" : ""}`}
                        style={{ width: c.collapsed ? 52 : c.width }}
                      >
                        <DraggableColumnHeader
                          column={c}
                          tasks={tasks}
                          disabled={filtering}
                          onPreview={setColumnDragPreview}
                          onHover={setDrop}
                          onMove={(beforeId) =>
                            void change((w) => moveColumn(w, c.id, beforeId))
                          }
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
                          <h2
                            title="Doppelklick zum Umbenennen"
                            onDoubleClick={() =>
                              nameDialog(
                                "Spalte umbenennen",
                                c.title,
                                (w, v) => {
                                  w.columns.find((x) => x.id === c.id)!.title =
                                    v;
                                },
                              )
                            }
                          >
                            {c.title}
                          </h2>
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
                                  className="danger"
                                  onClick={() =>
                                    confirmDelete(
                                      "Spalte löschen?",
                                      `„${c.title}“ und ${s.tasks.filter((t) => t.columnId === c.id).length} Aufgaben einschließlich Archiv dauerhaft löschen?`,
                                      (w) => removeColumn(w, c.id),
                                    )
                                  }
                                >
                                  Spalte löschen
                                </button>
                              </div>
                            </details>
                          )}
                        </DraggableColumnHeader>
                        {!c.collapsed && (
                          <>
                            <div className="cards">
                              {visible.map((t) => (
                                <TaskCard
                                  features={s.cardFeatures}
                                  key={t.id}
                                  task={t}
                                  showImages={s.showImages !== false}
                                  dependencies={s.tasks.filter((d) =>
                                    t.details?.dependencies?.includes(d.id),
                                  )}
                                  onCollapse={() =>
                                    void change((w) => {
                                      const task = w.tasks.find(
                                        (x) => x.id === t.id,
                                      )!;
                                      task.details ??= {};
                                      task.details.collapsed =
                                        !task.details.collapsed;
                                    })
                                  }
                                  disabled={filtering}
                                  drop={drop}
                                  preview={dragPreview}
                                  onFocus={focus.selectTask}
                                  notes={notesForTask(s.focusNotes, t)}
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
                    data-column-end
                    data-drop-active={drop === "column-end" || undefined}
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
                  {filtering
                    ? "Gefilterte Ansicht · zum Sortieren Filter zurücksetzen"
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
                <div className="global-search-filters">
                  <PriorityFilter
                    value={priorityFilter}
                    onChange={setPriorityFilter}
                  />
                  {filtering && (
                    <button
                      onClick={() => {
                        setQuery("");
                        setPriorityFilter("all");
                      }}
                    >
                      Suche und Filter zurücksetzen
                    </button>
                  )}
                </div>
                {filtering ? (
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
                          <PriorityBadge priority={t.priority} />
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
                {filtering && !s.tasks.some(matches) && (
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
      <FocusTimer
        controller={focus}
        workspace={s}
        boardTasks={boardTasks}
        change={change}
        error={error}
        pending={pending}
        drop={drop}
      />
      {archiveOpen && (
        <Archive
          workspace={s}
          boardId={board?.id}
          change={change}
          close={() => setArchiveOpen(false)}
        />
      )}
      {profileOpen && <Profile user={user} setUser={setUser} close={() => setProfileOpen(false)} />}
      {membersOpen && board && <Members user={user} boardId={board.id} close={() => setMembersOpen(false)} />}
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
          notes={notesForTask(s.focusNotes, modal.task)}
          workspace={s}
          archive={() => {
            void change((w) => {
              const t = w.tasks.find((t) => t.id === modal.task.id)!;
              if (t.details?.closedAt)
                t.details.archivedAt = new Date().toISOString();
            }).then((ok) => {
              if (ok) setModal(null);
            });
          }}
          save={(title, description, columnId, priority, details) =>
            change((w) => {
              const t = w.tasks.find((t) => t.id === modal.task.id)!;
              t.title = title;
              t.description = description;
              t.priority = priority;
              t.details = details;
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
          <div className="settings-tabs"><button className={settingsTab === "general" ? "primary" : ""} onClick={() => setSettingsTab("general")}>Allgemein</button><button className={settingsTab === "themes" ? "primary" : ""} onClick={() => setSettingsTab("themes")}>Themes</button><button className={settingsTab === "cards" ? "primary" : ""} onClick={() => setSettingsTab("cards")}>Karten</button><button className={settingsTab === "timer" ? "primary" : ""} onClick={() => setSettingsTab("timer")}>Focus-Timer</button></div>
          {settingsTab === "general" && <div className="settings-section">
            <h3>{tr("Sprache")}</h3>
            <div className="language-select"><span>{s.language === "en" ? "🇬🇧" : "🇩🇪"}</span><select aria-label={tr("Sprache")} value={s.language ?? "de"} onChange={e => { const language=e.currentTarget.value as "de"|"en"; void change(w=>{w.language=language}) }}><option value="de">Deutsch</option><option value="en">English</option></select></div>
            <h3>Deine Daten bleiben bei dir.</h3><p>Projekte und Änderungen werden automatisch in einer lokalen SQLite-Datenbank gespeichert.</p><label>Speicherort</label><code>{path}</code>
            <h3>TaskHub 0.1 · Aktuelle Features</h3><p>Projekte, Boards, Aufgaben, Checklisten, Prioritäten, Focus-Timer und Focus-Notizen sind verfügbar.</p>
          </div>}
          {settingsTab === "themes" && <div className="settings-section"><h3>Wähle die Atmosphäre für deinen Arbeitsplatz.</h3>
            <div
              className="theme-grid"
              role="radiogroup"
              aria-label="Theme auswählen"
            >
              {themes.map((theme) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={(s.theme ?? "cyberpunk") === theme}
                  className={`theme-choice theme-preview-${theme} ${(s.theme ?? "cyberpunk") === theme ? "selected" : ""}`}
                  key={theme}
                  onClick={() =>
                    void change((w) => {
                      w.theme = theme;
                    })
                  }
                >
                  <span className="theme-swatches">
                    <i />
                    <i />
                    <i />
                  </span>
                  <strong>{themeNames[theme]}</strong>
                  <small>
                    {theme === "cyberpunk"
                      ? "Dein bisheriges Theme"
                      : theme === "coffee"
                        ? "Warm und konzentriert"
                        : theme === "light"
                          ? "Hell und ruhig"
                          : "Klar und zurückhaltend"}
                  </small>
                </button>
              ))}
            </div>
          </div>}
          {settingsTab === "cards" && <div className="settings-section"><h3>{tr("Kartenfunktionen")}</h3><p className="muted">Deaktivierte Funktionen werden ausgeblendet. Inhalte bleiben gespeichert.</p><div className="feature-switches">{(Object.keys(cardFeatureNames) as CardFeature[]).map(key=><label key={key} className="check-label"><input type="checkbox" checked={featureEnabled(s,key)} onChange={e=>{const enabled=e.currentTarget.checked;void change(w=>{w.cardFeatures={...w.cardFeatures,[key]:enabled}})}} /> {cardFeatureNames[key]}</label>)}</div><h3>{tr("Darstellung")}</h3><label className="check-label"><input type="checkbox" checked={s.showImages !== false} onChange={(e) => { const showImages=e.currentTarget.checked; void change((w) => { w.showImages = showImages; }) }} /> {tr("Bilder auf Karten anzeigen")}</label></div>}
          {settingsTab === "timer" && <div className="settings-section"><h3>Focus-Timer</h3><p className="muted">Der Timer signalisiert das Ende einer Focus-Zeit mit einer gut hörbaren Tonfolge.</p><label className="timer-volume">Lautstärke <strong>{s.focusVolume ?? 55}%</strong><input type="range" min="0" max="100" step="1" value={s.focusVolume ?? 55} onChange={event => { const focusVolume=Number(event.currentTarget.value); void change(workspace => { workspace.focusVolume = focusVolume; }); }} /></label><p className="muted">Die Einstellung gilt auch für den Testton.</p><button className="primary" onClick={focus.testSound}>Timer-Signalton testen</button></div>}
          <button className="primary" onClick={() => setModal(null)}>
            Fertig
          </button>
        </Dialog>
      )}
    </div>
  );
}
