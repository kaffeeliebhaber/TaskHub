import { ordered, priorityNames, type Task, type Workspace } from "./model";
export function safeUrl(value: string) {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol);
  } catch {
    return false;
  }
}
export function canDepend(
  s: Workspace,
  taskId: string,
  dependencyId: string,
): boolean {
  const task = s.tasks.find((t) => t.id === taskId),
    dep = s.tasks.find((t) => t.id === dependencyId);
  if (!task || !dep || taskId === dependencyId) return false;
  const board = (t: Task) =>
    s.columns.find((c) => c.id === t.columnId)?.boardId;
  if (board(task) !== board(dep)) return false;
  const visited = new Set<string>();
  const reaches = (id: string): boolean => {
    if (id === taskId) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return (s.tasks.find((t) => t.id === id)?.details?.dependencies ?? []).some(
      reaches,
    );
  };
  return !reaches(dependencyId);
}
export interface ArchiveFilter {
  column: string;
  priority: string;
  createdFrom: string;
  createdTo: string;
  closedFrom: string;
  closedTo: string;
}
export const emptyFilter: ArchiveFilter = {
  column: "",
  priority: "",
  createdFrom: "",
  createdTo: "",
  closedFrom: "",
  closedTo: "",
};
export function archiveMatches(t: Task, f: ArchiveFilter) {
  const date = (v?: string | null) =>
    v ? new Date(v).toLocaleDateString("sv-SE") : "";
  const created = date(t.createdAt),
    closed = date(t.details?.closedAt);
  return (
    (!f.column || t.columnId === f.column) &&
    (!f.priority || (t.priority ?? "none") === f.priority) &&
    (!f.createdFrom || created >= f.createdFrom) &&
    (!f.createdTo || created <= f.createdTo) &&
    (!f.closedFrom || (!!closed && closed >= f.closedFrom)) &&
    (!f.closedTo || (!!closed && closed <= f.closedTo))
  );
}
export function boardCanvas(s: Workspace, boardId: string) {
  const columns = ordered(s.columns.filter((c) => c.boardId === boardId));
  const tasks = s.tasks.filter(
    (t) => !t.details?.archivedAt && columns.some((c) => c.id === t.columnId),
  );
  const nodes: object[] = [],
    edges: object[] = [];
  columns.forEach((c, i) => {
    const list = ordered(tasks.filter((t) => t.columnId === c.id));
    let y = 65;
    const cards = list.map((t) => {
      const text = [
        `## ${t.title}`,
        t.details?.closedAt ? "✓ Abgeschlossen" : "",
        `Priorität: ${priorityNames[t.priority ?? "none"]}`,
        t.description,
        ...(t.checklist?.items.map(
          (item) => `- [${item.done ? "x" : " "}] ${item.text}`,
        ) ?? []),
        ...(t.details?.links?.map((l) => `${l.title}: <${l.url}>`) ?? []),
        ...(s.focusNotes
          ?.filter((n) => n.taskId === t.id)
          .map((n) => `Notiz: ${n.text}`) ?? []),
      ]
        .filter(Boolean)
        .join("\n\n");
      const height = Math.max(220, Math.ceil(text.length / 35) * 22 + 100);
      const node = {
        id: t.id,
        type: "text",
        x: i * 410 + 20,
        y,
        width: 350,
        height,
        text,
        color: t.details?.closedAt ? "4" : "6",
      };
      y += height + 25;
      return node;
    });
    nodes.push(
      {
        id: `column-${c.id}`,
        type: "group",
        x: i * 410,
        y: 0,
        width: 390,
        height: Math.max(340, y),
        label: c.title,
      },
      ...cards,
    );
  });
  tasks.forEach((t) =>
    t.details?.dependencies?.forEach((id) => {
      if (tasks.some((d) => d.id === id))
        edges.push({
          id: `${id}-${t.id}`,
          fromNode: id,
          fromSide: "right",
          toNode: t.id,
          toSide: "left",
          toEnd: "arrow",
          label: "Voraussetzung",
          color: "6",
        });
    }),
  );
  return { nodes, edges };
}
