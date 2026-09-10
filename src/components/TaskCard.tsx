import { PriorityBadge } from "./Priority";
import { FocusNotes } from "./FocusNotes";
import { priorities, priorityNames, type Priority } from "../domain/model";
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
        <PriorityBadge priority={preview.task.priority} />
        <h3>{preview.task.title}</h3>
        {preview.task.description && <p>{preview.task.description}</p>}
      </div>
      <Checklist value={list} update={async () => false} />
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
  onPriority,
  notes,
}: {
  task: Task;
  disabled: boolean;
  drop: string | null;
  preview: DragPreview | null;
  onPreview: (preview: DragPreview | null) => void;
  onHover: (id: string | null) => void;
  onMove: (columnId: string, beforeId?: string) => void;
  onOpen: () => void;
  onFocus: (taskId: string) => void;
  onPriority: (priority: Priority) => Promise<boolean>;
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
        if (e.button !== 0) return;
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
            ".checklist, .priority-control, .focus-notes",
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
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
      </div>
      <GripVertical className="card-grip" size={13} />
      <div
        className="priority-control"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <label
          className={`priority-select priority-${task.priority ?? "none"}`}
        >
          <span className="sr-only">Priorität für {task.title}</span>
          <select
            aria-label={`Priorität für ${task.title}`}
            value={task.priority ?? "none"}
            onChange={(e) => void onPriority(e.target.value as Priority)}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p === "none" ? "Priorität festlegen" : priorityNames[p]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FocusNotes notes={notes} compact />
      <Checklist value={task.checklist} update={onChecklist} />
    </article>
  );
}
