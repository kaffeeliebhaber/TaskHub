import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Maximize2,
  Pause,
  Play,
  Square,
  Timer,
  X,
  StickyNote,
  Coffee,
} from "lucide-react";
import {
  appendFocusNote,
  changeFocus,
  formatTime,
  startFocus,
  type FocusSession,
} from "../domain/focus";
import { editChecklist, id, type Task, type Workspace } from "../domain/model";
import { useFocus } from "../hooks/useFocus";
import { PriorityBadge } from "./Priority";
import { FocusNotes } from "./FocusNotes";
import { Checklist } from "./Checklist";
type Controller = ReturnType<typeof useFocus>;
type Change = (edit: (w: Workspace) => void) => Promise<boolean>;
export function FocusButton({
  controller,
  workspace,
}: {
  controller: Controller;
  workspace: Workspace;
}) {
  const f = workspace.focus;
  return (
    <button
      className={`focus-button ${controller.active ? "timer-active" : ""}`}
      data-focus-drop={!controller.active ? "true" : undefined}
      title="Focus-Timer öffnen oder eine Aufgabe hierher ziehen"
      onClick={() =>
        controller.active
          ? controller.setImmersive(true)
          : controller.setDockOpen(!controller.dockOpen)
      }
    >
      <Timer size={17} />
      {controller.active && f
        ? `${formatTime(controller.remaining)}${f.status === "paused" ? " · Pause" : ""}`
        : "Focus-Timer"}
    </button>
  );
}
export function FocusTimer({
  controller: c,
  workspace: w,
  boardTasks,
  change,
  error,
  pending,
  drop,
}: {
  controller: Controller;
  workspace: Workspace;
  boardTasks: Task[];
  change: Change;
  error: string;
  pending: number;
  drop: string | null;
}) {
  const [minutes, setMinutes] = useState("25");
  const [inputError, setInputError] = useState("");
  const f = w.focus;
  const selected = w.tasks.find((t) => t.id === c.selectedTaskId);
  const begin = async () => {
    if (f) {
      try {
        if (localStorage.getItem(`taskhub-focus-draft-${f.id}`)?.trim()) {
          setInputError(
            "Bitte deinen Notizentwurf in der letzten Focus-Zeit speichern oder leeren.",
          );
          c.setImmersive(true);
          return;
        }
      } catch {
        setInputError(
          "Entwurf konnte nicht geprüft werden. Bitte Browserspeicher freigeben.",
        );
        return;
      }
    }
    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 1 || value > 240) {
      setInputError("Bitte 1 bis 240 Minuten eingeben.");
      return;
    }
    setInputError("");
    c.enableAudio();
    if (await change((s) => startFocus(s, value, selected?.id ?? null))) {
      c.setDockOpen(false);
      c.setImmersive(true);
    }
  };
  const sessionNotes = (w.focusNotes ?? []).filter(
    (n) => n.sessionId === f?.id,
  );
  return (
    <>
      {c.dockOpen && (
        <aside
          className={`focus-dock ${drop === "focus" ? "focus-drop-active" : ""}`}
          aria-label="Focus-Timer vorbereiten"
        >
          <header>
            <div>
              <span className="eyebrow">ZEIT FÜR DAS WESENTLICHE</span>
              <h2>
                <Timer size={18} />
                Focus-Timer
              </h2>
            </div>
            <button
              aria-label="Timer-Vorbereitung schließen"
              onClick={() => c.setDockOpen(false)}
            >
              <X size={17} />
            </button>
          </header>
          {c.active && f ? (
            <>
              <div className="dock-time">{formatTime(c.remaining)}</div>
              <p className="muted">{f.taskTitle || "Freie Focus-Zeit"}</p>
              <button
                className="primary wide"
                onClick={() => c.setImmersive(true)}
              >
                Focus-Ansicht öffnen
                <ChevronRight size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="duration-presets">
                {[25, 50, 90].map((value) => (
                  <button
                    key={value}
                    className={minutes === String(value) ? "selected" : ""}
                    onClick={() => setMinutes(String(value))}
                  >
                    {value} min
                  </button>
                ))}
              </div>
              <label className="duration-label">
                Deine Focus-Zeit
                <div>
                  <input
                    aria-label="Focus-Zeit in Minuten"
                    type="number"
                    min="1"
                    max="240"
                    step="1"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                  />
                  <span>Minuten</span>
                </div>
              </label>
              <div
                className={`focus-task-drop ${drop === "focus" ? "receiving" : ""}`}
                data-focus-drop="true"
              >
                {selected ? (
                  <div className="focus-selected" key={selected.id}>
                    <div>
                      <PriorityBadge priority={selected.priority} />
                      <strong>{selected.title}</strong>
                      <small>Für diese Focus-Zeit ausgewählt</small>
                    </div>
                    <button
                      aria-label="Aufgabe aus dem Timer entfernen"
                      onClick={() => c.setSelectedTaskId(null)}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="focus-drop-icon">
                      <PlusTaskIcon />
                    </span>
                    <strong>Eine Aufgabe. Dein Focus.</strong>
                    <p>Ziehe eine Karte aus dem Board hierher.</p>
                    <small>Oder starte einfach ohne Aufgabe.</small>
                  </>
                )}
              </div>
              <label className="focus-task-select">
                Aufgabe auswählen
                <select
                  aria-label="Aufgabe für Focus-Zeit"
                  value={selected?.id ?? ""}
                  onChange={(e) => c.setSelectedTaskId(e.target.value || null)}
                >
                  <option value="">Ohne Aufgabe starten</option>
                  {selected &&
                    !boardTasks.some((t) => t.id === selected.id) && (
                      <option value={selected.id}>{selected.title}</option>
                    )}
                  {boardTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
              {inputError && (
                <p className="danger" role="alert">
                  {inputError}
                </p>
              )}
              <button
                className="primary wide"
                disabled={!!error || pending > 0}
                onClick={() => void begin()}
              >
                <Play size={15} />
                Focus starten
              </button>
            </>
          )}
          {(w.focusNotes?.length ?? 0) > 0 && (
            <FocusNotes notes={w.focusNotes ?? []} />
          )}
        </aside>
      )}
      {c.immersive && f && (
        <FocusRoom
          key={f.id}
          session={f}
          workspace={w}
          remaining={c.remaining}
          change={change}
          pending={pending}
          error={error}
          close={() => c.setImmersive(false)}
          newSession={() => {
            c.setImmersive(false);
            c.setDockOpen(true);
          }}
        />
      )}
    </>
  );
}
function PlusTaskIcon() {
  return <StickyNote size={24} />;
}
function FocusRoom({
  session: f,
  workspace,
  remaining,
  change,
  pending,
  error,
  close,
  newSession,
}: {
  session: FocusSession;
  workspace: Workspace;
  remaining: number;
  change: Change;
  pending: number;
  error: string;
  close: () => void;
  newSession: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const task = workspace.tasks.find((t) => t.id === f.taskId);
  const completed =
    f.status === "completed" || (f.status === "running" && remaining === 0);
  const ended = completed || f.status === "stopped";
  const progress = Math.min(1, Math.max(0, 1 - remaining / f.durationMs));
  useEffect(() => {
    ref.current!.showModal();
    return () => ref.current?.close();
  }, []);
  const leave = async () => {
    if (document.fullscreenElement)
      await document.exitFullscreen().catch(() => {});
    close();
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await ref.current?.requestFullscreen();
      setFullscreenError("");
    } catch {
      setFullscreenError(
        "Vollbild ist hier nicht verfügbar. Die Focus-Ansicht bleibt geöffnet.",
      );
    }
  };
  return (
    <dialog
      ref={ref}
      className="focus-room"
      aria-label="Focus-Ansicht"
      onCancel={(e) => {
        e.preventDefault();
        void leave();
      }}
    >
      <div className="focus-room-inner">
        <header className="focus-room-header">
          <button onClick={() => void leave()}>
            <ArrowLeft size={16} />
            Zurück zum Board
          </button>
          <span>
            <Timer size={15} />
            FOCUS TIME
          </span>
          <button
            aria-label="Vollbild umschalten"
            title="Vollbild"
            onClick={() => void fullscreen()}
          >
            <Maximize2 size={17} />
          </button>
        </header>
        <div className="focus-room-content">
          <div className="focus-clock-block">
            <div
              className={`focus-state ${ended ? "finished" : ""}`}
              role="status"
            >
              {completed ? (
                <>
                  <Check size={14} />
                  Geschafft. Zeit für eine Pause.
                </>
              ) : f.status === "stopped" ? (
                "Focus-Zeit beendet"
              ) : f.status === "paused" ? (
                "PAUSE · DEIN MOMENT ZUM DURCHATMEN"
              ) : (
                "NUR DIESER MOMENT."
              )}
            </div>
            <div
              className="focus-clock"
              role="timer"
              aria-label="Verbleibende Focus-Zeit"
              aria-live="off"
            >
              {formatTime(remaining)}
            </div>
            <div
              className="focus-time-track"
              role="progressbar"
              aria-label="Verstrichene Focus-Zeit"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <span style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="focus-duration-caption">
              {f.durationMs / 60000} Minuten für das, was dir wichtig ist.
            </p>
            <div className="focus-current-task">
              {task ? (
                <>
                  <PriorityBadge priority={task.priority} />
                  <h1>{task.title}</h1>
                  {task.description && <p>{task.description}</p>}
                </>
              ) : (
                <>
                  <h1>{f.taskTitle || "Raum für deinen Focus."}</h1>
                  <p>
                    {f.taskTitle
                      ? "Die Aufgabe wurde entfernt. Deine Focus-Notizen bleiben erhalten."
                      : "Diese Zeit gehört dir. Auch ohne Aufgabe."}
                  </p>
                </>
              )}
            </div>
            {task && (
              <div className="focus-current-checklist">
                <Checklist
                  value={task.checklist}
                  update={(edit) =>
                    change((w) => {
                      const current = w.tasks.find(
                        (item) => item.id === task.id,
                      );
                      if (current) editChecklist(current, edit);
                    })
                  }
                />
              </div>
            )}
            <div className="focus-controls">
              {!ended ? (
                <>
                  <button
                    className="primary"
                    disabled={pending > 0 || !!error}
                    onClick={() =>
                      void change((w) => {
                        if (w.focus?.id === f.id)
                          changeFocus(
                            w,
                            f.status === "paused" ? "resume" : "pause",
                          );
                      })
                    }
                  >
                    {f.status === "paused" ? (
                      <>
                        <Play size={16} />
                        Fortsetzen
                      </>
                    ) : (
                      <>
                        <Pause size={16} />
                        Pause
                      </>
                    )}
                  </button>
                  <button
                    className="end-focus"
                    onClick={() => setConfirmStop(true)}
                  >
                    <Square size={14} />
                    Beenden
                  </button>
                </>
              ) : (
                <button
                  className="primary"
                  disabled={pending > 0 || !!error}
                  onClick={() => {
                    void leave().then(newSession);
                  }}
                >
                  <Coffee size={16} />
                  Neue Focus-Zeit
                </button>
              )}
            </div>
            {confirmStop && !ended && (
              <div className="stop-confirm">
                <p>
                  Focus-Zeit jetzt beenden? Gespeicherte Notizen bleiben
                  erhalten.
                </p>
                <div>
                  <button onClick={() => setConfirmStop(false)}>
                    Weiter fokussieren
                  </button>
                  <button
                    disabled={pending > 0 || !!error}
                    onClick={async () => {
                      if (
                        await change((w) => {
                          if (w.focus?.id === f.id) changeFocus(w, "stop");
                        })
                      ) {
                        setConfirmStop(false);
                        await leave();
                        newSession();
                      }
                    }}
                  >
                    Focus-Zeit beenden
                  </button>
                </div>
              </div>
            )}
          </div>
          <section className="focus-writing">
            <header>
              <StickyNote size={17} />
              <h2>Gedanken festhalten</h2>
              <span>{task ? "An dieser Aufgabe" : "Für diese Focus-Zeit"}</span>
            </header>
            <NoteComposer session={f} change={change} error={error} />
            <div className="room-notes">
              {(workspace.focusNotes ?? [])
                .filter((n) => n.sessionId === f.id)
                .slice()
                .reverse()
                .map((n) => (
                  <article className="saved-note" key={n.id}>
                    <time>
                      {new Date(n.createdAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    <p>{n.text}</p>
                    <small>
                      <Check size={11} />
                      {n.taskId
                        ? "An der Aufgabe gespeichert"
                        : "In deinen Focus-Notizen gespeichert"}
                    </small>
                  </article>
                ))}
            </div>
          </section>
        </div>
        {error && (
          <div role="alert" className="focus-error">
            Speichern fehlgeschlagen: {error}{" "}
            <button onClick={() => void leave()}>Zum Board</button>
          </div>
        )}
        {fullscreenError && <p className="focus-error">{fullscreenError}</p>}
        <footer className="focus-room-footer">
          Ein Schritt nach dem anderen.
          <span>
            {ended
              ? "Deine Notizen bleiben."
              : "Der Timer läuft auch bei Rückkehr zum Board weiter."}
          </span>
        </footer>
      </div>
    </dialog>
  );
}
function NoteComposer({
  session,
  change,
  error,
}: {
  session: FocusSession;
  change: Change;
  error: string;
}) {
  const key = `taskhub-focus-draft-${session.id}`;
  const [draft, setDraft] = useState(() => {
    try {
      return localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  });
  const [busy, setBusy] = useState(false);
  const [draftError, setDraftError] = useState("");
  const saveDraft = (value: string) => {
    setDraft(value);
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
      setDraftError("");
    } catch {
      setDraftError(
        "Entwurf kann nicht zwischengespeichert werden. Bitte Notiz speichern, bevor du die Seite verlässt.",
      );
    }
  };
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (draftError && draft) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft, draftError]);
  const submit = async () => {
    if (!draft.trim() || busy) return;
    setBusy(true);
    const noteId = id();
    const ok = await change((w) =>
      appendFocusNote(w, session.id, draft, noteId),
    );
    if (ok) saveDraft("");
    setBusy(false);
  };
  return (
    <form
      className="note-composer"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <textarea
        aria-label="Notiz zur Focus-Zeit"
        placeholder="Eine Idee, ein nächster Schritt, etwas zum Merken …"
        value={draft}
        maxLength={10000}
        onChange={(e) => saveDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <div>
        <small>
          {draft
            ? "Entwurf · Strg+Enter zum Speichern"
            : "Notizen werden mit dieser Focus-Zeit verknüpft."}
        </small>
        <button className="primary" disabled={!draft.trim() || busy || !!error}>
          <PlusNote />
          Notiz speichern
        </button>
      </div>
      {draftError && (
        <p className="danger" role="alert">
          {draftError}
        </p>
      )}
    </form>
  );
}
function PlusNote() {
  return <Check size={14} />;
}
