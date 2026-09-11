import { describe, it, expect } from "vitest";
import {
  addProject,
  addTask,
  emptyWorkspace,
  moveTask,
  moveColumn,
  ordered,
  removeProject,
  validate,
} from "../src/domain/model";
import { WorkspaceStore } from "../src/data/store";
import type { WorkspaceRepository } from "../src/data/repository";
const fixture = () => {
  const s = emptyWorkspace();
  addProject(s, "Haushalt");
  for (const name of ["A", "B", "C"]) addTask(s, s.columns[0].id, name);
  return s;
};
describe("board operations", () => {
  it("moves a complete column while preserving its tasks", () => {
    const workspace = emptyWorkspace();
    addProject(workspace, "Projekt");
    const [first, second, third] = ordered(workspace.columns);
    addTask(workspace, first.id, "Bleibt in der Spalte");
    moveColumn(workspace, first.id, third.id);
    expect(ordered(workspace.columns).map((column) => column.id)).toEqual([
      second.id,
      first.id,
      third.id,
    ]);
    expect(workspace.tasks[0].columnId).toBe(first.id);
  });

  it("accepts the four themes and rejects unknown values", () => {
    const workspace = emptyWorkspace();
    for (const theme of ["light", "dark", "cyberpunk", "coffee"] as const) {
      workspace.theme = theme;
      expect(() => validate(workspace)).not.toThrow();
    }
    (workspace as { theme?: string }).theme = "unknown";
    expect(() => validate(workspace)).toThrow("Ungültiges Theme");
  });

  it("reorders cards in both directions without duplicates", () => {
    const s = fixture();
    const [a, b, c] = s.tasks;
    moveTask(s, c.id, a.columnId, a.id);
    expect(ordered(s.tasks).map((t) => t.title)).toEqual(["C", "A", "B"]);
    moveTask(s, c.id, a.columnId);
    expect(ordered(s.tasks).map((t) => t.title)).toEqual(["A", "B", "C"]);
    moveTask(s, b.id, a.columnId, b.id);
    expect(s.tasks.length).toBe(3);
  });
  it("moves to an empty column and normalizes both lists", () => {
    const s = fixture();
    moveTask(s, s.tasks[1].id, s.columns[1].id);
    expect(
      ordered(s.tasks.filter((t) => t.columnId === s.columns[0].id)).map(
        (t) => t.position,
      ),
    ).toEqual([0, 1]);
    expect(s.tasks[1].position).toBe(0);
    validate(s);
  });
  it("rejects cross-board moves", () => {
    const s = fixture();
    const task = s.tasks[0];
    addProject(s, "Reise");
    expect(() => moveTask(s, task.id, s.columns[3].id)).toThrow();
  });
  it("moves columns including the last position", () => {
    const s = fixture();
    moveColumn(s, s.columns[0].id);
    expect(ordered(s.columns).map((c) => c.title)).toEqual([
      "In Arbeit",
      "Erledigt",
      "Offen",
    ]);
  });
  it("deletes only the selected project and chooses the remaining project", () => {
    const s = fixture();
    const first = s.activeProjectId!;
    addProject(s, "Reise");
    removeProject(s, first);
    expect(s.tasks).toHaveLength(0);
    expect(s.columns).toHaveLength(3);
    expect(s.projects[0].name).toBe("Reise");
    validate(s);
  });
});
describe("durable store", () => {
  it("serializes concurrent actions against the latest committed revision", async () => {
    let persisted = emptyWorkspace();
    const repository: WorkspaceRepository = {
      preview: false,
      location: async () => "",
      load: async () => structuredClone(persisted),
      save: async (next) => {
        expect(next.revision).toBe(persisted.revision);
        await Promise.resolve();
        persisted = structuredClone({ ...next, revision: next.revision + 1 });
        return persisted.revision;
      },
    };
    const store = new WorkspaceStore(repository);
    await store.load();
    await Promise.all([
      store.change((s) => {
        addProject(s, "A");
      }),
      store.change((s) => {
        addProject(s, "B");
      }),
    ]);
    expect(store.snapshot().workspace.projects).toHaveLength(2);
    expect(persisted.revision).toBe(2);
    expect(store.snapshot().pending).toBe(0);
  });
  it("keeps the committed state and stops writes after a storage failure", async () => {
    const repository: WorkspaceRepository = {
      preview: false,
      location: async () => "",
      load: async () => emptyWorkspace(),
      save: async () => {
        throw new Error("Disk full");
      },
    };
    const store = new WorkspaceStore(repository);
    await store.load();
    expect(
      await store.change((s) => {
        addProject(s, "A");
      }),
    ).toBe(false);
    expect(store.snapshot().workspace.projects).toHaveLength(0);
    expect(store.snapshot().error).toContain("Disk full");
  });
});

it("appends after deletions without reusing an occupied position", () => {
  const s = fixture();
  s.tasks = s.tasks.filter((t) => t.title !== "B");
  addTask(s, s.columns[0].id, "D");
  expect(ordered(s.tasks).map((t) => t.title)).toEqual(["A", "C", "D"]);
  expect(new Set(s.tasks.map((t) => t.position)).size).toBe(3);
});

it("keeps checklist progress and folding when moving a task", () => {
  const s = fixture();
  const task = s.tasks[0];
  task.checklist = {
    title: "Material",
    collapsed: true,
    items: [
      { id: "one", text: "Farbe", done: true },
      { id: "two", text: "Pinsel", done: false },
    ],
  };
  moveTask(s, task.id, s.columns[1].id);
  validate(s);
  const restored = JSON.parse(JSON.stringify(s));
  expect(
    restored.tasks[0].checklist.items.filter((i: { done: boolean }) => i.done),
  ).toHaveLength(1);
  expect(restored.tasks[0].checklist.collapsed).toBe(true);
});
it("rejects invalid checklists while accepting existing tasks without a checklist", () => {
  const s = fixture();
  expect(() => validate(s)).not.toThrow();
  s.tasks[0].checklist = {
    title: "Material",
    collapsed: false,
    items: [
      { id: "same", text: "Farbe", done: false },
      { id: "same", text: "Pinsel", done: false },
    ],
  };
  expect(() => validate(s)).toThrow("Checkliste");
});
