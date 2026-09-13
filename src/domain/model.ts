import { canDepend, safeUrl } from "./taskTools";
import type { FocusSession, FocusNote } from "./focus";
export interface Project {
  id: string;
  name: string;
  createdAt: string;
}
export interface Board {
  id: string;
  projectId: string;
}
export interface Column {
  id: string;
  boardId: string;
  title: string;
  position: number;
  width: number;
  collapsed: boolean;
}
export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}
export interface Checklist {
  title: string;
  collapsed: boolean;
  items: ChecklistItem[];
}
export const priorities = [
  "none",
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type Priority = (typeof priorities)[number];
export const priorityNames: Record<Priority, string> = {
  none: "Keine",
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};
export const themes = ["light", "dark", "cyberpunk", "coffee"] as const;
export type Theme = (typeof themes)[number];
export const themeNames: Record<Theme, string> = {
  light: "Hell",
  dark: "Dunkel",
  cyberpunk: "Cyberpunk",
  coffee: "Kaffee",
};
export interface TaskDetails {
  closedAt?: string | null;
  archivedAt?: string | null;
  collapsed?: boolean;
  dependencies?: string[];
  links?: { id: string; url: string; title: string }[];
  images?: { id: string; name: string; data: string }[];
}
export interface Task {
  details?: TaskDetails;

  priority?: Priority;
  checklist?: Checklist | null;
  id: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}
export interface Workspace {
  focusVolume?: number;
  language?: "de" | "en";
  cardFeatures?: Partial<Record<CardFeature, boolean>>;
  showImages?: boolean;
  theme?: Theme;
  sidebarCollapsed?: boolean;
  focus?: FocusSession | null;
  focusNotes?: FocusNote[];
  revision: number;
  projects: Project[];
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  activeProjectId: string | null;
}
export const cardFeatureNames = { description: "Beschreibung", priority: "Priorität", checklist: "Checkliste", notes: "Focus-Notizen", images: "Bilder", links: "URLs", dependencies: "Abhängigkeiten", completion: "Abschlussstatus", collapse: "Karte einklappen", focus: "Focus-Timer" } as const;
export type CardFeature = keyof typeof cardFeatureNames;
export const featureEnabled = (s: Workspace, feature: CardFeature) => s.cardFeatures?.[feature] !== false;
export const emptyWorkspace = (): Workspace => ({
  theme: "cyberpunk",
  language: "de",
  focusVolume: 55,
  revision: 0,
  projects: [],
  boards: [],
  columns: [],
  tasks: [],
  activeProjectId: null,
});
export const ordered = <T extends { position: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.position - b.position);
export const id = () => crypto.randomUUID();
export function addProject(s: Workspace, name: string): string {
  const projectId = id(),
    boardId = id();
  s.projects.push({
    id: projectId,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  });
  s.boards.push({ id: boardId, projectId });
  ["Offen", "In Arbeit", "Erledigt"].forEach((title, position) =>
    s.columns.push({
      id: id(),
      boardId,
      title,
      position,
      width: 300,
      collapsed: false,
    }),
  );
  s.activeProjectId = projectId;
  return projectId;
}
export function addTask(s: Workspace, columnId: string, title: string) {
  if (!s.columns.some((c) => c.id === columnId))
    throw new Error("Spalte nicht gefunden.");
  const now = new Date().toISOString();
  s.tasks.push({
    id: id(),
    columnId,
    title: title.trim(),
    description: "",
    position:
      Math.max(
        -1,
        ...s.tasks
          .filter((t) => t.columnId === columnId)
          .map((t) => t.position),
      ) + 1,
    createdAt: now,
    updatedAt: now,
  });
}
export function moveTask(
  s: Workspace,
  taskId: string,
  columnId: string,
  beforeId?: string,
) {
  const task = s.tasks.find((t) => t.id === taskId),
    column = s.columns.find((c) => c.id === columnId);
  if (!task || !column || taskId === beforeId) return;
  if (s.columns.find((c) => c.id === task.columnId)?.boardId !== column.boardId)
    throw new Error(
      "Tasks können nur innerhalb ihres Boards verschoben werden.",
    );
  const old = task.columnId;
  const target = ordered(
    s.tasks.filter((t) => t.columnId === columnId && t.id !== taskId),
  );
  const index = beforeId
    ? target.findIndex((t) => t.id === beforeId)
    : target.length;
  if (index < 0) return;
  task.columnId = columnId;
  task.updatedAt = new Date().toISOString();
  target.splice(index, 0, task);
  target.forEach((t, i) => (t.position = i));
  if (old !== columnId)
    ordered(s.tasks.filter((t) => t.columnId === old)).forEach(
      (t, i) => (t.position = i),
    );
}
export function moveColumn(s: Workspace, columnId: string, beforeId?: string) {
  const col = s.columns.find((c) => c.id === columnId);
  if (!col || columnId === beforeId) return;
  const columns = ordered(
    s.columns.filter((c) => c.boardId === col.boardId && c.id !== columnId),
  );
  const index = beforeId
    ? columns.findIndex((c) => c.id === beforeId)
    : columns.length;
  if (index < 0) return;
  columns.splice(index, 0, col);
  columns.forEach((c, i) => (c.position = i));
}
export function removeColumn(s: Workspace, columnId: string) {
  s.tasks = s.tasks.filter((t) => t.columnId !== columnId);
  s.columns = s.columns.filter((c) => c.id !== columnId);
}
export function removeProject(s: Workspace, projectId: string) {
  const board = s.boards.find((b) => b.projectId === projectId);
  s.columns
    .filter((c) => c.boardId === board?.id)
    .forEach((c) => removeColumn(s, c.id));
  s.boards = s.boards.filter((b) => b.projectId !== projectId);
  s.projects = s.projects.filter((p) => p.id !== projectId);
  if (s.activeProjectId === projectId)
    s.activeProjectId = s.projects[0]?.id ?? null;
}
export function validate(s: Workspace) {
  if (s.focusVolume !== undefined && (!Number.isInteger(s.focusVolume) || s.focusVolume < 0 || s.focusVolume > 100))
    throw new Error("Ungültige Focus-Lautstärke.");
  if (s.theme !== undefined && !themes.includes(s.theme))
    throw new Error("Ungültiges Theme.");
  if (
    s.sidebarCollapsed !== undefined &&
    typeof s.sidebarCollapsed !== "boolean"
  )
    throw new Error("Ungültige Darstellungseinstellung.");
  const f = s.focus;
  if (
    f &&
    (!f.id ||
      !["running", "paused", "completed", "stopped"].includes(f.status) ||
      !Number.isSafeInteger(f.durationMs) ||
      f.durationMs < 60000 ||
      f.durationMs > 14400000 ||
      !Number.isSafeInteger(f.remainingMs) ||
      f.remainingMs < 0 ||
      f.remainingMs > f.durationMs ||
      (f.status === "running"
        ? !Number.isSafeInteger(f.endAt) || f.endAt! <= 0
        : f.endAt !== null) ||
      (f.status === "completed" && f.remainingMs !== 0) ||
      (f.taskId !== null && !s.tasks.some((t) => t.id === f.taskId)))
  )
    throw new Error("Ungültige Focus-Zeit.");
  const notes = s.focusNotes ?? [];
  if (
    new Set(notes.map((n) => n.id)).size !== notes.length ||
    notes.some(
      (n) =>
        !n.id ||
        !n.sessionId ||
        !n.text.trim() ||
        n.text.length > 10000 ||
        !Number.isFinite(Date.parse(n.createdAt)) ||
        (n.taskId !== null && !s.tasks.some((t) => t.id === n.taskId)),
    )
  )
    throw new Error("Ungültige Focus-Notiz.");
  if (s.tasks.some((t) => !priorities.includes(t.priority ?? "none")))
    throw new Error("Ungültige Priorität.");
  for (const task of s.tasks) {
    const d = task.details;
    if (d) {
      if (
        (d.closedAt && !Number.isFinite(Date.parse(d.closedAt))) ||
        (d.archivedAt && !Number.isFinite(Date.parse(d.archivedAt)))
      )
        throw Error("Ungültiges Abschlussdatum.");
      if (d.links?.some((l) => !safeUrl(l.url)))
        throw Error("Links benötigen http oder https.");
      if (
        (d.images?.length ?? 0) > 6 ||
        d.images?.some(
          (i) =>
            !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(
              i.data,
            ) || i.data.length > 2800000,
        )
      )
        throw Error("Ungültiges Bild.");
      if (d.dependencies?.some((id) => !canDepend(s, task.id, id)))
        throw Error(
          "Abhängigkeiten müssen im selben Board liegen und dürfen keinen Kreis bilden.",
        );
    }
    const list = task.checklist;
    if (
      list &&
      (!list.title.trim() ||
        list.title.length > 120 ||
        typeof list.collapsed !== "boolean" ||
        list.items.length > 200 ||
        new Set(list.items.map((i) => i.id)).size !== list.items.length ||
        list.items.some(
          (i) =>
            !i.id ||
            !i.text.trim() ||
            i.text.length > 300 ||
            typeof i.done !== "boolean",
        ))
    )
      throw new Error("Ungültige Checkliste.");
  }
  const unique = (rows: { id: string }[]) =>
    rows.every((r) => r.id.length > 0) &&
    new Set(rows.map((r) => r.id)).size === rows.length;
  if (![s.projects, s.boards, s.columns, s.tasks].every(unique))
    throw new Error("Ungültige IDs.");
  if (s.projects.some((p) => !p.name.trim() || p.name.length > 120))
    throw new Error("Projektname: 1–120 Zeichen.");
  if (
    s.projects.some(
      (p) => s.boards.filter((b) => b.projectId === p.id).length !== 1,
    ) ||
    s.boards.some((b) => !s.projects.some((p) => p.id === b.projectId))
  )
    throw new Error("Jedes Projekt benötigt genau ein Board.");
  if (
    s.boards.some(
      (b) => s.columns.filter((c) => c.boardId === b.id).length > 15,
    )
  )
    throw new Error("Maximal 15 Spalten pro Board.");
  if (
    s.columns.some(
      (c) =>
        !s.boards.some((b) => b.id === c.boardId) ||
        !c.title.trim() ||
        c.title.length > 120 ||
        c.width < 220 ||
        c.width > 600 ||
        !Number.isInteger(c.position) ||
        c.position < 0,
    )
  )
    throw new Error("Ungültige Spalte.");
  if (
    s.tasks.some(
      (t) =>
        !s.columns.some((c) => c.id === t.columnId) ||
        !t.title.trim() ||
        t.title.length > 300 ||
        t.description.length > 100000 ||
        !Number.isInteger(t.position) ||
        t.position < 0,
    )
  )
    throw new Error("Ungültige Aufgabe.");
  if (s.activeProjectId && !s.projects.some((p) => p.id === s.activeProjectId))
    throw new Error("Projekt nicht gefunden.");
}

export function editChecklist(task: Task, edit: (list: Checklist) => void) {
  task.checklist ??= { title: "Checkliste", collapsed: false, items: [] };
  edit(task.checklist);
  task.updatedAt = new Date().toISOString();
}

export function matchesTask(
  task: Task,
  query: string,
  priority: Priority | "all",
  notes: FocusNote[] = [],
) {
  const text = [
    task.title,
    task.description,
    task.checklist?.title ?? "",
    ...(task.checklist?.items.map((i) => i.text) ?? []),
    ...notes.filter((n) => n.taskId === task.id).map((n) => n.text),
  ]
    .join(" ")
    .toLocaleLowerCase("de");
  return (
    (priority === "all" || (task.priority ?? "none") === priority) &&
    text.includes(query.trim().toLocaleLowerCase("de"))
  );
}
