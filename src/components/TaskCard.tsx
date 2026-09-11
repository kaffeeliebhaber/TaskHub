import { openExternal } from "../data/external";
import { PriorityText } from "./Priority";
import { FocusNotes } from "./FocusNotes";
import type { FocusNote } from "../domain/focus";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { GripVertical } from "lucide-react";
import type { Checklist as ChecklistModel, Task } from "../domain/model";
import { Checklist } from "./Checklist";
export interface DragPreview {
  task: Task;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}
export function DragAvatar({ preview }: { preview: DragPreview | null }) {
  if (!preview) return null;
  const list = preview.task.checklist;
  return createPortal(
    <div
      aria-hidden="true"
      inert
      className="task-card drag-avatar"
      style={{
        left: preview.x - preview.offsetX,
        top: preview.y - preview.offsetY,
        width: preview.width,
        minHeight: preview.height,
        transformOrigin: `${preview.offsetX}px ${preview.offsetY}px`,
      }}
    >
      <div className="card-open">
        <div className="card-title-row">
          <h3>{preview.task.title}</h3>
          {!preview.task.details?.collapsed && (
            <PriorityText priority={preview.task.priority} />
          )}
        </div>
        {!preview.task.details?.collapsed && preview.task.description && (
          <p>{preview.task.description}</p>
        )}
      </div>
      {!preview.task.details?.collapsed && (
        <Checklist value={list} update={async () => false} />
      )}
    </div>,
    document.body,
  );
}
export function TaskCard({
  task,
  disabled,
  drop,
  preview,
  onPreview,
  onHover,
  onMove,
  onOpen,
  onChecklist,
  onFocus,
  notes,
  onCollapse,
  showImages = true,
  dependencies = [],
}: {
  onCollapse: () => void;
  showImages?: boolean;
  dependencies?: Task[];
  task: Task;
  disabled: boolean;
  drop: string | null;
  preview: DragPreview | null;
  onPreview: (preview: DragPreview | null) => void;
  onHover: (id: string | null) => void;
  onMove: (columnId: string, beforeId?: string) => void;
  onOpen: () => void;
  onFocus: (taskId: string) => void;
  notes: FocusNote[];
  onChecklist: (edit: (list: ChecklistModel) => void) => Promise<boolean>;
}) {
  const ref = useRef<HTMLElement>(null);
  const pointer = useRef<
    | (DragPreview & {
        startX: number;
        startY: number;
        pointerId: number;
        moved: boolean;
      })
    | null
  >(null);
  const suppressClick = useRef(false);
  const reset = () => {
    const p = pointer.current;
    pointer.current = null;
    if (p && ref.current?.hasPointerCapture(p.pointerId))
      ref.current.releasePointerCapture(p.pointerId);
    onPreview(null);
    onHover(null);
  };
  useEffect(() => {
    const cancel = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pointer.current) {
        suppressClick.current = pointer.current.moved;
        reset();
      }
    };
    const blur = () => {
      if (pointer.current) {
        suppressClick.current = pointer.current.moved;
        reset();
      }
    };
    window.addEventListener("keydown", cancel);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", cancel);
      window.removeEventListener("blur", blur);
    };
  });
  const hit = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    return {
      focus: !!el?.closest("[data-focus-drop]"),
      column: el?.closest<HTMLElement>("[data-column-id]")?.dataset.columnId,
      task: el?.closest<HTMLElement>("[data-task-id]")?.dataset.taskId,
    };
  };
  return (
    <article
      ref={ref}
      aria-label={task.title}
      data-task-id={task.id}
      className={`task-card ${drop === task.id ? "drop-target" : ""} ${preview?.task.id === task.id ? "drag-source" : ""}`}
      onPointerDown={(e) => {
        if (
          e.button !== 0 ||
          (e.target as HTMLElement).closest(
            ".card-toggle, a, .checklist, .focus-notes",
          )
        )
          return;
        suppressClick.current = false;
        const box = e.currentTarget.getBoundingClientRect();
        pointer.current = {
          task,
          startX: e.clientX,
          startY: e.clientY,
          x: e.clientX,
          y: e.clientY,
          offsetX: e.clientX - box.left,
          offsetY: e.clientY - box.top,
          width: box.width,
          height: box.height,
          pointerId: e.pointerId,
          moved: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const p = pointer.current;
        if (!p) return;
        if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > 5)
          p.moved = true;
        if (p.moved) {
          e.preventDefault();
          onPreview({ ...p, x: e.clientX, y: e.clientY });
          const target = hit(e.clientX, e.clientY);
          onHover(
            target.focus ? "focus" : (target.task ?? target.column ?? null),
          );
        }
      }}
      onPointerUp={(e) => {
        const p = pointer.current;
        const target = hit(e.clientX, e.clientY);
        reset();
        if (!p?.moved) return;
        suppressClick.current = true;
        if (target.focus) onFocus(task.id);
        else if (target.column && !disabled) onMove(target.column, target.task);
      }}
      onPointerCancel={() => {
        suppressClick.current = !!pointer.current?.moved;
        reset();
      }}
      onLostPointerCapture={() => {
        if (pointer.current) {
          suppressClick.current = pointer.current.moved;
          reset();
        }
      }}
      onClick={(e) => {
        if (
          (e.target as HTMLElement).closest(
            ".checklist, .focus-notes, .card-toggle, a",
          )
        )
          return;
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        onOpen();
      }}
    >
      <div
        className="card-open"
        role="button"
        tabIndex={0}
        aria-label={`Aufgabe ${task.title} bearbeiten`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <div className="card-title-row">
          <h3>{task.title}</h3>
          {!task.details?.collapsed && (
            <PriorityText priority={task.priority} />
          )}
        </div>
        {!task.details?.collapsed && task.description && (
          <p>{task.description}</p>
        )}
      </div>
      <button
        className="card-toggle"
        aria-label={
          task.details?.collapsed ? "Karte aufklappen" : "Karte einklappen"
        }
        aria-expanded={!task.details?.collapsed}
        onClick={onCollapse}
      >
        {task.details?.collapsed ? "⌄" : "⌃"}
      </button>
      {!task.details?.collapsed && (
        <>
          {task.details?.closedAt && (
            <small className="card-meta">✓ Abgeschlossen</small>
          )}
          {dependencies.length > 0 && (
            <small className="card-meta">
              {dependencies.some((t) => !t.details?.closedAt)
                ? "↳ Wartet auf"
                : "✓ Freigegeben"}
              : {dependencies.map((t) => t.title).join(", ")}
            </small>
          )}
          {showImages && (
            <div className="card-images">
              {task.details?.images?.map((img) => (
                <img key={img.id} src={img.data} alt={img.name} />
              ))}
            </div>
          )}
          {task.details?.links?.map((l) => (
            <a
              className="card-link"
              key={l.id}
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
              ↗ {l.title}
            </a>
          ))}
          <GripVertical className="card-grip" size={13} />
          <FocusNotes notes={notes} compact />
          <Checklist value={task.checklist} update={onChecklist} />
        </>
      )}
    </article>
  );
}
