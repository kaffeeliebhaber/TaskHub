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
export interface Task {
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
  revision: number;
  projects: Project[];
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  activeProjectId: string | null;
}
export const emptyWorkspace = (): Workspace => ({
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
  for (const task of s.tasks) {
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
