import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { priorities, priorityNames, type Task, type Workspace } from "../domain/model";
import { archiveMatches, emptyFilter } from "../domain/taskTools";
import { Dialog } from "./Dialog";

const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("de-DE") : "–";

function searchableText(workspace: Workspace, task: Task) {
  return [
    task.title,
    task.description,
    task.checklist?.title,
    ...(task.checklist?.items.map((item) => item.text) ?? []),
    ...(task.details?.links?.flatMap((link) => [link.title, link.url]) ?? []),
    ...(task.details?.images?.map((image) => image.name) ?? []),
    ...(workspace.focusNotes
      ?.filter((note) => note.taskId === task.id)
      .map((note) => note.text) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

export function ArchivePage({
  workspace,
  change,
  openTask,
}: {
  workspace: Workspace;
  change: (edit: (workspace: Workspace) => void) => Promise<boolean>;
  openTask: (task: Task) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(emptyFilter);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<"selected" | "matches" | null>(null);
  const [restore, setRestore] = useState<{ projectId: string; columnId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const columns = workspace.columns;
  const rows = useMemo(
    () =>
      workspace.tasks.filter(
        (task) =>
          !!task.details?.archivedAt &&
          archiveMatches(task, filter) &&
          searchableText(workspace, task).includes(query.trim().toLocaleLowerCase()),
      ),
    [workspace, filter, query],
  );
  const hasFilters =
    !!query.trim() || Object.values(filter).some((value) => !!value);
  const clearFilters = () => {
    setQuery("");
    setFilter(emptyFilter);
  };
  const chosen = rows.filter((task) => selected.includes(task.id));
  const projectForTask = (task: Task) => {
    const boardId = columns.find((column) => column.id === task.columnId)?.boardId;
    const projectId = workspace.boards.find((board) => board.id === boardId)?.projectId;
    return workspace.projects.find((project) => project.id === projectId);
  };
  const columnsForProject = (projectId: string) => {
    const boardIds = new Set(
      workspace.boards
        .filter((board) => board.projectId === projectId)
        .map((board) => board.id),
    );
    return columns.filter((column) => boardIds.has(column.boardId));
  };
  const openRestore = () => {
    const first = chosen[0];
    const projectId = first ? projectForTask(first)?.id ?? workspace.projects[0]?.id ?? "" : "";
    const targetColumns = columnsForProject(projectId);
    setRestore({
      projectId,
      columnId: first && targetColumns.some((column) => column.id === first.columnId)
        ? first.columnId
        : targetColumns[0]?.id ?? "",
    });
  };
  const targets = confirm === "selected" ? chosen : rows;
  const deleteTasks = async () => {
    setBusy(true);
    const ids = new Set(targets.map((task) => task.id));
    const ok = await change((next) => {
      next.tasks = next.tasks.filter((task) => !ids.has(task.id));
      next.focusNotes = (next.focusNotes ?? []).filter(
        (note) => !note.taskId || !ids.has(note.taskId),
      );
    });
    setBusy(false);
    if (ok) {
      setSelected((current) => current.filter((id) => !ids.has(id)));
      setConfirm(null);
    }
  };
  const restoreTasks = async () => {
    if (!restore?.columnId) return;
    setBusy(true);
    const ids = new Set(chosen.map((task) => task.id));
    const ok = await change((next) => {
      const nextPosition =
        Math.max(
          -1,
          ...next.tasks
            .filter((task) => task.columnId === restore.columnId && !ids.has(task.id))
            .map((task) => task.position),
        ) + 1;
      next.tasks
        .filter((task) => ids.has(task.id))
        .forEach((task, index) => {
          task.details ??= {};
          task.details.archivedAt = null;
          task.columnId = restore.columnId;
          task.position = nextPosition + index;
          task.updatedAt = new Date().toISOString();
        });
    });
    setBusy(false);
    if (ok) {
      setSelected([]);
      setRestore(null);
    }
  };

  return (
    <div className="overview archive-overview">
      <div className="archive-toolbar">
        <div className="search-field large">
          <Search size={18} />
          <input
            autoFocus
            aria-label="Archiv durchsuchen"
            placeholder="Im Archiv suchen – auch in Notizen, Checklisten und Links …"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button disabled={!chosen.length} onClick={openRestore}>
          {chosen.length ? `${chosen.length} Markierte wiederherstellen` : "Markierte wiederherstellen"}
        </button>
        <button className="danger" disabled={!chosen.length} onClick={() => setConfirm("selected")}>
          {chosen.length ? `${chosen.length} markierte löschen …` : "Markierte löschen …"}
        </button>
      </div>

      <div className="archive-filter-wrap">
        <button
          className="archive-filter-toggle"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal size={15} />
          Filter{hasFilters ? " aktiv" : ""}
          <ChevronDown size={15} className={filtersOpen ? "rotated" : ""} />
        </button>
        {filtersOpen && (
          <div className="archive-filters archive-filter-panel">
            <label>
              Spalte
              <select
                value={filter.column}
                onChange={(event) => setFilter({ ...filter, column: event.target.value })}
              >
                <option value="">Alle Spalten</option>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priorität
              <select
                value={filter.priority}
                onChange={(event) => setFilter({ ...filter, priority: event.target.value })}
              >
                <option value="">Alle Prioritäten</option>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityNames[priority]}
                  </option>
                ))}
              </select>
            </label>
            {(["createdFrom", "createdTo", "closedFrom", "closedTo"] as const).map(
              (key, index) => (
                <label key={key}>
                  {["Erstellt ab", "Erstellt bis", "Geschlossen ab", "Geschlossen bis"][index]}
                  <input
                    type="date"
                    value={filter[key]}
                    onChange={(event) => setFilter({ ...filter, [key]: event.target.value })}
                  />
                </label>
              ),
            )}
            {hasFilters && <button onClick={clearFilters}>Filter zurücksetzen</button>}
            <button
              className="danger archive-bulk-delete"
              disabled={!rows.length}
              onClick={() => setConfirm("matches")}
            >
              Alle {rows.length} Treffer löschen …
            </button>
          </div>
        )}
      </div>

      <div className="archive-list-table" role="table" aria-label="Archivierte Aufgaben">
        <div className="archive-list-head" role="row">
          <span>
            <input
              aria-label="Alle Treffer markieren"
              type="checkbox"
              checked={!!rows.length && rows.every((task) => selected.includes(task.id))}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...new Set([...current, ...rows.map((task) => task.id)])]
                    : current.filter((id) => !rows.some((task) => task.id === id)),
                )
              }
            />
            Name
          </span><span>Projekt</span><span>Priorität</span><span>Erstellt am</span><span>Geschlossen am</span>
        </div>
        {rows.map((task) => (
          <button
            className="archive-list-row"
            key={task.id}
            onClick={() => openTask(task)}
            title="Aufgabe öffnen"
          >
            <span className="archive-task-name">
              <input
                aria-label={`${task.title} markieren`}
                type="checkbox"
                checked={selected.includes(task.id)}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, task.id]
                      : current.filter((id) => id !== task.id),
                  )
                }
              />
              {task.title}
            </span>
            <span>{projectForTask(task)?.name ?? "–"}</span>
            <span className={`priority-text priority-${task.priority ?? "none"}`}>
              {priorityNames[task.priority ?? "none"]}
            </span>
            <span>{date(task.createdAt)}</span>
            <span>{date(task.details?.closedAt)}</span>
          </button>
        ))}
        {!rows.length && (
          <p className="muted archive-empty">
            {hasFilters ? "Keine archivierten Aufgaben passen zu deiner Suche oder den Filtern." : "Dein Archiv ist noch leer."}
          </p>
        )}
      </div>

      {confirm && (
        <Dialog title="Archivierte Aufgaben endgültig löschen?" close={() => setConfirm(null)}>
          <p>
            {targets.length} {confirm === "selected" ? "markierte" : "aktuell gefilterte"} Aufgaben werden mit ihren Bildern, Links,
            Checklisten und Focus-Notizen unwiderruflich gelöscht.
          </p>
          <div className="dialog-actions">
            <button onClick={() => setConfirm(null)}>Abbrechen</button>
            <button className="destructive" disabled={busy} onClick={() => void deleteTasks()}>
              {targets.length} Aufgaben endgültig löschen
            </button>
          </div>
        </Dialog>
      )}
      {restore && (
        <Dialog title="Aufgaben wiederherstellen" close={() => setRestore(null)}>
          <p>
            {chosen.length} markierte Aufgaben werden wieder im ausgewählten Projekt und
            in der ausgewählten Spalte sichtbar.
          </p>
          <label>
            Projekt
            <select
              value={restore.projectId}
              onChange={(event) => {
                const projectId = event.target.value;
                setRestore({
                  projectId,
                  columnId: columnsForProject(projectId)[0]?.id ?? "",
                });
              }}
            >
              {workspace.projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
          <label>
            Spalte
            <select
              value={restore.columnId}
              onChange={(event) => setRestore({ ...restore, columnId: event.target.value })}
            >
              {columnsForProject(restore.projectId).map((column) => (
                <option key={column.id} value={column.id}>{column.title}</option>
              ))}
            </select>
          </label>
          <div className="dialog-actions">
            <button onClick={() => setRestore(null)}>Abbrechen</button>
            <button className="primary" disabled={busy || !restore.columnId} onClick={() => void restoreTasks()}>
              Wiederherstellen
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
