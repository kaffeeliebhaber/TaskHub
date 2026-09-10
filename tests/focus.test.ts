import { describe, it, expect } from "vitest";
import {
  addProject,
  addTask,
  emptyWorkspace,
  matchesTask,
  validate,
} from "../src/domain/model";
import {
  startFocus,
  changeFocus,
  focusRemaining,
  appendFocusNote,
  detachDeletedTasks,
} from "../src/domain/focus";
function sample() {
  const w = emptyWorkspace();
  addProject(w, "Test");
  addTask(w, w.columns[0].id, "Planung");
  return w;
}
describe("Focus-Zeit und Prioritäten", () => {
  it("uses deadlines across reloads and pauses without losing remaining time", () => {
    const w = sample();
    startFocus(w, 1, w.tasks[0].id, 1000);
    expect(focusRemaining(JSON.parse(JSON.stringify(w.focus)), 11000)).toBe(
      50000,
    );
    changeFocus(w, "pause", 11000);
    expect(focusRemaining(w.focus!, 90000)).toBe(50000);
    changeFocus(w, "resume", 90000);
    expect(w.focus!.endAt).toBe(140000);
    changeFocus(w, "complete", 150000);
    expect(w.focus!.status).toBe("completed");
    validate(w);
  });
  it("keeps notes on tasks and preserves them after task deletion", () => {
    const w = sample();
    startFocus(w, 25, w.tasks[0].id);
    const column = w.tasks[0].columnId;
    appendFocusNote(w, w.focus!.id, " Nächster Schritt ", "00000000-0000-4000-8000-000000000001");
    appendFocusNote(w, w.focus!.id, "Nächster Schritt", "00000000-0000-4000-8000-000000000001");
    expect(w.tasks[0].columnId).toBe(column);
    expect(w.focusNotes).toHaveLength(1);
    w.tasks = [];
    detachDeletedTasks(w);
    expect(w.focusNotes![0].taskId).toBeNull();
    expect(w.focusNotes![0].taskTitle).toBe("Planung");
    validate(w);
  });
  it("supports sessions without a task and rejects invalid durations or overlapping sessions", () => {
    const w = sample();
    expect(() => startFocus(w, 0, null)).toThrow();
    expect(() => startFocus(w, 1.5, null)).toThrow();
    startFocus(w, 1, null);
    appendFocusNote(w, w.focus!.id, "Freie Idee");
    expect(w.focusNotes![0].taskId).toBeNull();
    expect(() => startFocus(w, 25, null)).toThrow();
    validate(w);
  });
  it("combines text, notes and priority filtering", () => {
    const w = sample();
    const t = w.tasks[0];
    t.priority = "high";
    startFocus(w, 1, t.id);
    appendFocusNote(w, w.focus!.id, "Prototyp prüfen");
    expect(matchesTask(t, "prototyp", "high", w.focusNotes)).toBe(true);
    expect(matchesTask(t, "prototyp", "low", w.focusNotes)).toBe(false);
    expect(matchesTask(t, "unbekannt", "high", w.focusNotes)).toBe(false);
    expect(matchesTask(t, "", "high")).toBe(true);
  });
});
