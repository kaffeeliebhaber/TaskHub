import { TaskDetails } from "./TaskDetails";
import type { Workspace, TaskDetails as Details } from "../domain/model";
import type { FocusNote } from "../domain/focus";
import { FocusNotes } from "./FocusNotes";
import { useRef, useState, type FormEvent } from "react";
import {
  priorities,
  priorityNames,
  type Priority,
  type Column,
  type Task,
} from "../domain/model";
import { Dialog } from "./Dialog";
export function NameDialog({
  title,
  initial,
  submit,
  close,
}: {
  title: string;
  initial: string;
  submit: (v: string) => Promise<boolean>;
  close: () => void;
}) {
  const [value, setValue] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog title={title} close={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if (await submit(value.trim())) close();
          else
            setError(
              "Nicht gespeichert. Bitte den Fehler im Hauptfenster prüfen.",
            );
          setBusy(false);
        }}
      >
        <label>
          Name
          <input
            autoFocus
            required
            maxLength={120}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        {error && (
          <p className="danger" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" onClick={close}>
            Abbrechen
          </button>
          <button className="primary" disabled={!value.trim() || busy}>
            Übernehmen
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function TaskInput({
  submit,
  close,
}: {
  submit: (title: string) => Promise<boolean>;
  close: () => void;
}) {
  const [title, setTitle] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="task-input"
      onSubmit={async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        if (await submit(title.trim())) setTitle("");
        setBusy(false);
      }}
    >
      <input
        autoFocus
        aria-label="Titel der neuen Aufgabe"
        placeholder="Was möchtest du erledigen?"
        maxLength={300}
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      />
      <div>
        <button type="button" onClick={close}>
          Abbrechen
        </button>
        <button className="primary" disabled={!title.trim() || busy}>
          Hinzufügen
        </button>
      </div>
    </form>
  );
}
export function TaskEditor({
  task,
  notes,
  columns,
  close,
  save,
  remove,
  workspace,
  archive,
}: {
  workspace: Workspace;
  archive: () => void;
  task: Task;
  notes: FocusNote[];
  columns: Column[];
  close: () => void;
  save: (
    title: string,
    description: string,
    columnId: string,
    priority: Priority,
    details: Details,
  ) => Promise<boolean>;
  remove: () => void;
}) {
  const [readingImages, setReadingImages] = useState(false);
  const [details, setDetails] = useState<Details>(task.details ?? {});
  const [title, setTitle] = useState(task.title),
    [description, setDescription] = useState(task.description),
    [columnId, setColumnId] = useState(task.columnId),
    [priority, setPriority] = useState<Priority>(task.priority ?? "none"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog title="Aufgabe bearbeiten" close={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if (
            await save(title.trim(), description, columnId, priority, details)
          )
            close();
          else
            setError(
              "Änderung nicht gespeichert. Deine Eingabe bleibt hier erhalten.",
            );
          setBusy(false);
        }}
      >
        <label>
          Titel
          <input
            autoFocus
            required
            maxLength={300}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Beschreibung
          <textarea
            rows={7}
            maxLength={100000}
            placeholder="Gedanken, Details und nächste Schritte …"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label>
          Spalte
          <select
            value={columnId}
            onChange={(e) => setColumnId(e.target.value)}
          >
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
            aria-label="Priorität der Aufgabe"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {priorityNames[p]}
              </option>
            ))}
          </select>
        </label>
        <TaskDetails
          task={task}
          workspace={workspace}
          value={details}
          onChange={setDetails}
          onBusy={setReadingImages}
        />
        <FocusNotes notes={notes} />
        <p className="muted">
          Erstellt am {new Date(task.createdAt).toLocaleDateString("de-DE")}
        </p>
        {error && (
          <p className="danger" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="danger" onClick={remove}>
            Löschen
          </button>
          {details.closedAt && (
            <button
              type="button"
              disabled={busy || readingImages || !title.trim()}
              onClick={async () => {
                setBusy(true);
                if (
                  await save(
                    title.trim(),
                    description,
                    columnId,
                    priority,
                    details,
                  )
                )
                  archive();
                else setError("Nicht gespeichert. Bitte Fehler prüfen.");
                setBusy(false);
              }}
            >
              Archivieren
            </button>
          )}
          <div className="spacer" />
          <button type="button" onClick={close}>
            Abbrechen
          </button>
          <button
            className="primary"
            disabled={!title.trim() || busy || readingImages}
          >
            Speichern
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function ResizeHandle({
  column,
  save,
}: {
  column: Column;
  save: (width: number) => void;
}) {
  const start = useRef({ x: 0, width: 0, next: 0 });
  return (
    <div
      className="resize-handle"
      title="Spaltenbreite ziehen"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = {
          x: e.clientX,
          width: column.width,
          next: column.width,
        };
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          const width = Math.round(
            Math.max(
              220,
              Math.min(600, start.current.width + e.clientX - start.current.x),
            ),
          );
          start.current.next = width;
          e.currentTarget.parentElement!.style.width = `${width}px`;
        }
      }}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
          save(start.current.next);
        }
      }}
      onPointerCancel={(e) => {
        e.currentTarget.parentElement!.style.width = `${column.width}px`;
      }}
    />
  );
}
