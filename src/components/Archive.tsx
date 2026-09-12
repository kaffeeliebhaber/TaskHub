import { openExternal } from "../data/external";
import { useState } from "react";
import { Dialog } from "./Dialog";
import { priorities, priorityNames, type Workspace } from "../domain/model";
import { archiveMatches, emptyFilter } from "../domain/taskTools";
export function Archive({
  workspace: s,
  boardId,
  change,
  close,
}: {
  workspace: Workspace;
  boardId?: string;
  change: (edit: (s: Workspace) => void) => Promise<boolean>;
  close: () => void;
}) {
  const [mode, setMode] = useState<"archive" | "job">("archive"),
    [filter, setFilter] = useState(emptyFilter),
    [selected, setSelected] = useState<string[]>([]),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false);
  const columns = s.columns.filter((c) => !boardId || c.boardId === boardId);
  const rows = s.tasks.filter(
    (t) =>
      columns.some((c) => c.id === t.columnId) &&
      (mode === "archive"
        ? !!t.details?.archivedAt
        : !!t.details?.closedAt && !t.details.archivedAt) &&
      archiveMatches(t, filter),
  );
  const chosen = rows.filter((t) => selected.includes(t.id));
  const act = async (action: "archive" | "restore" | "delete") => {
    setBusy(true);
    const ids = new Set(chosen.map((t) => t.id));
    const ok = await change((w) => {
      if (action === "delete") w.tasks = w.tasks.filter((t) => !ids.has(t.id));
      else
        w.tasks
          .filter((t) => ids.has(t.id))
          .forEach((t) => {
            t.details ??= {};
            t.details.archivedAt =
              action === "archive" ? new Date().toISOString() : null;
            t.updatedAt = new Date().toISOString();
          });
    });
    setBusy(false);
    if (ok) {
      setSelected([]);
      setConfirm(false);
    }
  };
  return (
    <Dialog title="Aufgabenarchiv" close={close}>
      <div className="extra-row">
        <button
          className={mode === "archive" ? "primary" : ""}
          onClick={() => {
            setMode("archive");
            setSelected([]);
            setConfirm(false);
          }}
        >
          Archiv ansehen
        </button>
        <button
          className={mode === "job" ? "primary" : ""}
          onClick={() => {
            setMode("job");
            setSelected([]);
            setConfirm(false);
          }}
        >
          Archivierungsjob
        </button>
      </div>
      <p>
        {mode === "job"
          ? "Abgeschlossene Aufgaben filtern, auswählen und archivieren."
          : "Archivierte Aufgaben ansehen, wiederherstellen oder dauerhaft löschen."}
      </p>
      <div className="archive-filters">
        <label>
          Spalte
          <select
            value={filter.column}
            onChange={(e) => setFilter({ ...filter, column: e.target.value })}
          >
            <option value="">Alle Spalten</option>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priorität
          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          >
            <option value="">Alle Prioritäten</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {priorityNames[p]}
              </option>
            ))}
          </select>
        </label>
        {(["createdFrom", "createdTo", "closedFrom", "closedTo"] as const).map(
          (key, i) => (
            <label key={key}>
              {
                [
                  "Erstellt ab",
                  "Erstellt bis",
                  "Geschlossen ab",
                  "Geschlossen bis",
                ][i]
              }
              <input
                type="date"
                value={filter[key]}
                onChange={(e) =>
                  setFilter({ ...filter, [key]: e.target.value })
                }
              />
            </label>
          ),
        )}
      </div>
      <button
        onClick={() => {
          setSelected(rows.map((t) => t.id));
          setConfirm(false);
        }}
      >
        Alle {rows.length} Treffer markieren
      </button>
      <button onClick={() => setSelected([])}>Auswahl aufheben</button>
      <div className="archive-list">
        {rows.map((t) => (
          <details key={t.id}>
            <summary>
              <input
                aria-label={`${t.title} markieren`}
                type="checkbox"
                checked={selected.includes(t.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  setSelected(
                    e.target.checked
                      ? [...selected, t.id]
                      : selected.filter((id) => id !== t.id),
                  );
                  setConfirm(false);
                }}
              />{" "}
              {t.title}
            </summary>
            <p>{t.description}</p>
            <small>
              {columns.find((c) => c.id === t.columnId)?.title} ·{" "}
              {priorityNames[t.priority ?? "none"]} · Geschlossen:{" "}
              {t.details?.closedAt
                ? new Date(t.details.closedAt).toLocaleDateString("de-DE")
                : "–"}
            </small>
            {t.checklist?.items.map((i) => (
              <p key={i.id}>
                {i.done ? "☑" : "☐"} {i.text}
              </p>
            ))}
            {s.focusNotes
              ?.filter((n) => n.taskId === t.id)
              .map((n) => (
                <p key={n.id}>{n.text}</p>
              ))}
            {t.details?.links?.map((l) => (
              <p key={l.id}>
                <a
                  href={l.url}
                  onClick={(e) => {
                    e.preventDefault();
                    void openExternal(l.url).catch((error) =>
                      window.alert(String(error)),
                    );
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {l.title}
                </a>
              </p>
            ))}
            <div className="task-image-grid">
              {t.details?.images?.map((img) => (
                <img key={img.id} src={img.data} alt={img.name} />
              ))}
            </div>
          </details>
        ))}
        {!rows.length && <p>Keine passenden Aufgaben.</p>}
      </div>
      <div className="dialog-actions">
        {mode === "job" ? (
          <button
            className="primary"
            disabled={!chosen.length || busy}
            onClick={() => void act("archive")}
          >
            {chosen.length} Aufgaben archivieren
          </button>
        ) : (
          <>
            <button
              disabled={!chosen.length || busy}
              onClick={() => void act("restore")}
            >
              Wiederherstellen
            </button>
            <button
              className="danger"
              disabled={!chosen.length || busy}
              onClick={() => setConfirm(true)}
            >
              Endgültig löschen …
            </button>
          </>
        )}
      </div>
      {confirm && (
        <div role="alert">
          <p>
            {chosen.length} Aufgaben mit Bildern, Links und Checklisten
            unwiderruflich löschen?
          </p>
          <button onClick={() => setConfirm(false)}>Abbrechen</button>
          <button
            className="destructive"
            disabled={busy || !chosen.length}
            onClick={() => void act("delete")}
          >
            Löschen bestätigen
          </button>
        </div>
      )}
    </Dialog>
  );
}
