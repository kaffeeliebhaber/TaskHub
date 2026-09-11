import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Column, Task } from "../domain/model";
import { PriorityText } from "./Priority";

export interface ColumnDragPreview {
  column: Column;
  tasks: Task[];
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export function ColumnDragAvatar({
  preview,
}: {
  preview: ColumnDragPreview | null;
}) {
  if (!preview) return null;
  return createPortal(
    <section
      className="column column-drag-avatar"
      aria-hidden="true"
      inert
      style={{
        left: preview.x - preview.offsetX,
        top: preview.y - preview.offsetY,
        width: preview.width,
        height: Math.min(preview.height, 520),
        transformOrigin: `${preview.offsetX}px ${preview.offsetY}px`,
      }}
    >
      <header className="column-header">
        <span className="column-indicator color-0" />
        <h2>{preview.column.title}</h2>
        <span className="count">{preview.tasks.length}</span>
      </header>
      <div className="cards">
        {preview.tasks.map((task) => (
          <article className="task-card" key={task.id}>
            <div className="card-open">
              <div className="card-title-row">
                <h3>{task.title}</h3>
                <PriorityText priority={task.priority} />
              </div>
              {task.description && <p>{task.description}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>,
    document.body,
  );
}

export function DraggableColumnHeader({
  column,
  tasks,
  disabled,
  onPreview,
  onHover,
  onMove,
  children,
}: {
  column: Column;
  tasks: Task[];
  disabled: boolean;
  onPreview: (preview: ColumnDragPreview | null) => void;
  onHover: (target: string | null) => void;
  onMove: (beforeId?: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const pointer = useRef<
    | (ColumnDragPreview & {
        startX: number;
        startY: number;
        pointerId: number;
        moved: boolean;
      })
    | null
  >(null);
  const reset = () => {
    const active = pointer.current;
    pointer.current = null;
    if (active && ref.current?.hasPointerCapture(active.pointerId))
      ref.current.releasePointerCapture(active.pointerId);
    onPreview(null);
    onHover(null);
  };
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => {
      if (event.key === "Escape" && pointer.current) reset();
    };
    const blur = () => {
      if (pointer.current) reset();
    };
    window.addEventListener("keydown", cancel);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", cancel);
      window.removeEventListener("blur", blur);
    };
  });
  const targetAt = (x: number, y: number) => {
    const element = document.elementFromPoint(x, y);
    if (element?.closest("[data-column-end]")) return "column-end";
    return (
      element?.closest<HTMLElement>("[data-column-id]")?.dataset.columnId ??
      null
    );
  };
  return (
    <header
      ref={ref}
      className="column-header column-drag-surface"
      onPointerDown={(event) => {
        if (
          disabled ||
          event.button !== 0 ||
          (event.target as HTMLElement).closest(
            "button, details, input, textarea, select, a",
          )
        )
          return;
        const section = event.currentTarget.closest<HTMLElement>(".column")!;
        const box = section.getBoundingClientRect();
        pointer.current = {
          column,
          tasks,
          startX: event.clientX,
          startY: event.clientY,
          x: event.clientX,
          y: event.clientY,
          offsetX: event.clientX - box.left,
          offsetY: event.clientY - box.top,
          width: box.width,
          height: box.height,
          pointerId: event.pointerId,
          moved: false,
        };
      }}
      onPointerMove={(event) => {
        const active = pointer.current;
        if (!active) return;
        if (
          Math.hypot(
            event.clientX - active.startX,
            event.clientY - active.startY,
          ) > 5
        )
          active.moved = true;
        if (active.moved) {
          event.preventDefault();
          if (!event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.setPointerCapture(event.pointerId);
          onPreview({ ...active, x: event.clientX, y: event.clientY });
          onHover(targetAt(event.clientX, event.clientY));
        }
      }}
      onPointerUp={(event) => {
        const active = pointer.current;
        const target = targetAt(event.clientX, event.clientY);
        reset();
        if (!active?.moved) return;
        event.preventDefault();
        if (target === "column-end") onMove();
        else if (target) onMove(target);
      }}
      onPointerCancel={reset}
      onLostPointerCapture={() => {
        if (pointer.current) reset();
      }}
    >
      {children}
    </header>
  );
}
