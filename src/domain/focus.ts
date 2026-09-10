import { id, type Workspace, type Task } from "./model";
export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string;
  durationMs: number;
  remainingMs: number;
  endAt: number | null;
  status: "running" | "paused" | "completed" | "stopped";
  createdAt: string;
}
export interface FocusNote {
  id: string;
  sessionId: string;
  taskId: string | null;
  taskTitle: string;
  text: string;
  createdAt: string;
}
export const focusRemaining = (focus: FocusSession, now = Date.now()) =>
  focus.status === "running"
    ? Math.max(0, (focus.endAt ?? now) - now)
    : focus.remainingMs;
export const formatTime = (ms: number) => {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
};
export function startFocus(
  w: Workspace,
  minutes: number,
  taskId: string | null,
  now = Date.now(),
) {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240)
    throw new Error("Bitte 1 bis 240 Minuten wählen.");
  if (w.focus && ["running", "paused"].includes(w.focus.status))
    throw new Error("Beende zuerst die aktuelle Focus-Zeit.");
  const task = w.tasks.find((t) => t.id === taskId);
  if (taskId && !task)
    throw new Error("Die ausgewählte Aufgabe existiert nicht mehr.");
  w.focus = {
    id: id(),
    taskId: task?.id ?? null,
    taskTitle: task?.title ?? "",
    durationMs: minutes * 60000,
    remainingMs: minutes * 60000,
    endAt: now + minutes * 60000,
    status: "running",
    createdAt: new Date(now).toISOString(),
  };
}
export function changeFocus(
  w: Workspace,
  action: "pause" | "resume" | "complete" | "stop",
  now = Date.now(),
) {
  const f = w.focus;
  if (!f) return;
  const remaining = focusRemaining(f, now);
  if (action === "resume" && f.status === "paused") {
    f.status = "running";
    f.endAt = now + f.remainingMs;
    return;
  }
  if (action === "pause" && f.status === "running") {
    f.remainingMs = remaining;
    f.endAt = null;
    f.status = remaining > 0 ? "paused" : "completed";
    return;
  }
  if (action === "complete" && f.status === "running" && remaining === 0) {
    f.status = "completed";
    f.remainingMs = 0;
    f.endAt = null;
    return;
  }
  if (action === "stop" && ["running", "paused"].includes(f.status)) {
    f.status = remaining === 0 ? "completed" : "stopped";
    f.remainingMs = remaining;
    f.endAt = null;
  }
}
export function appendFocusNote(
  w: Workspace,
  sessionId: string,
  text: string,
  noteId = id(),
  now = Date.now(),
) {
  const f = w.focus;
  if (!f || f.id !== sessionId)
    throw new Error(
      "Die Focus-Zeit hat sich geändert. Bitte deinen Entwurf prüfen.",
    );
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 10000)
    throw new Error("Eine Notiz benötigt 1 bis 10.000 Zeichen.");
  w.focusNotes ??= [];
  if (w.focusNotes.some((n) => n.id === noteId)) return;
  const task = w.tasks.find((t) => t.id === f.taskId);
  w.focusNotes.push({
    id: noteId,
    sessionId,
    taskId: task?.id ?? null,
    taskTitle: task?.title ?? f.taskTitle,
    text: trimmed,
    createdAt: new Date(now).toISOString(),
  });
  if (task) task.updatedAt = new Date(now).toISOString();
}
export function detachDeletedTasks(w: Workspace) {
  const exists = (taskId: string | null) =>
    !!taskId && w.tasks.some((t) => t.id === taskId);
  if (w.focus?.taskId && !exists(w.focus.taskId)) w.focus.taskId = null;
  w.focusNotes?.forEach((n) => {
    if (n.taskId && !exists(n.taskId)) n.taskId = null;
  });
}
export function notesForTask(notes: FocusNote[] | undefined, task: Task) {
  return (notes ?? []).filter((n) => n.taskId === task.id);
}
