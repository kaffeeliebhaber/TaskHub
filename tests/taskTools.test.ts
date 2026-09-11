import { describe, expect, it } from "vitest";
import {
  addProject,
  addTask,
  emptyWorkspace,
  validate,
} from "../src/domain/model";
import {
  archiveMatches,
  boardCanvas,
  canDepend,
  emptyFilter,
  safeUrl,
} from "../src/domain/taskTools";
import { WorkspaceStore } from "../src/data/store";
function fixture() {
  const s = emptyWorkspace();
  addProject(s, "Test");
  addTask(s, s.columns[0].id, "A");
  addTask(s, s.columns[1].id, "B");
  return s;
}
describe("Task lifecycle", () => {
  it("combines date, column and priority filters without treating open tasks as closed", () => {
    const s = fixture(),
      t = s.tasks[0];
    t.createdAt = "2026-09-01T12:00:00Z";
    t.priority = "high";
    expect(
      archiveMatches(t, { ...emptyFilter, closedFrom: "2026-09-01" }),
    ).toBe(false);
    t.details = { closedAt: "2026-09-05T12:00:00Z" };
    expect(
      archiveMatches(t, {
        ...emptyFilter,
        column: t.columnId,
        priority: "high",
        createdFrom: "2026-09-01",
        createdTo: "2026-09-01",
        closedTo: "2026-09-05",
      }),
    ).toBe(true);
    expect(archiveMatches(t, { ...emptyFilter, priority: "low" })).toBe(false);
  });
  it("rejects self references, cycles, missing and cross-board dependencies", () => {
    const s = fixture(),
      [a, b] = s.tasks;
    b.details = { dependencies: [a.id] };
    expect(canDepend(s, a.id, b.id)).toBe(false);
    expect(canDepend(s, a.id, a.id)).toBe(false);
    expect(canDepend(s, a.id, "missing")).toBe(false);
    addProject(s, "Other");
    addTask(s, s.columns[3].id, "C");
    expect(canDepend(s, a.id, s.tasks[2].id)).toBe(false);
    a.details = { dependencies: [b.id] };
    expect(() => validate(s)).toThrow();
  });
  it("exports columns as groups, active tasks as cards and dependencies as arrows", () => {
    const s = fixture(),
      [a, b] = s.tasks;
    b.details = { dependencies: [a.id] };
    a.checklist = {
      title: "Steps",
      collapsed: false,
      items: [{ id: "i", text: "Done", done: true }],
    };
    const canvas = boardCanvas(s, s.boards[0].id);
    expect(canvas.edges).toHaveLength(1);
    expect(JSON.stringify(canvas)).toContain("- [x] Done");
    a.details = { archivedAt: new Date().toISOString() };
    const archived = boardCanvas(s, s.boards[0].id);
    expect(archived.edges).toHaveLength(0);
    expect(archived.nodes.some((n: any) => n.id === a.id)).toBe(false);
  });
  it("removes dangling dependencies and detaches focus references on deletion", async () => {
    const s = fixture(),
      [a, b] = s.tasks;
    b.details = { dependencies: [a.id] };
    const store = new WorkspaceStore({
      preview: true,
      load: async () => structuredClone(s),
      save: async (w) => w.revision + 1,
      location: async () => "",
    });
    await store.load();
    expect(
      await store.change((w) => {
        w.tasks = w.tasks.filter((t) => t.id !== a.id);
      }),
    ).toBe(true);
    expect(store.snapshot().workspace.tasks[0].details?.dependencies).toEqual(
      [],
    );
  });
  it("allows web URLs only", () => {
    expect(safeUrl("https://example.com")).toBe(true);
    expect(safeUrl("javascript:alert(1)")).toBe(false);
    expect(safeUrl("file:///tmp/test")).toBe(false);
  });
});
