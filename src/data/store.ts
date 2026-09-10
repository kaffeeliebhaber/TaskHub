import { detachDeletedTasks } from "../domain/focus";
import { emptyWorkspace, validate, type Workspace } from "../domain/model";
import { type WorkspaceRepository } from "./repository";
export class WorkspaceStore {
  private listeners = new Set<() => void>();
  private tail: Promise<void> = Promise.resolve();
  private state = {
    workspace: emptyWorkspace(),
    loading: true,
    pending: 0,
    error: "",
  };
  constructor(private repository: WorkspaceRepository) {}
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit(patch: Partial<typeof this.state>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }
  async load() {
    try {
      this.emit({
        workspace: await this.repository.load(),
        loading: false,
        error: "",
      });
    } catch (e) {
      this.emit({ loading: false, error: String(e) });
    }
  }
  change = (edit: (s: Workspace) => void): Promise<boolean> => {
    this.emit({ pending: this.state.pending + 1 });
    let success = false;
    const run = this.tail.then(async () => {
      try {
        if (this.state.error) throw new Error(this.state.error);
        const next = structuredClone(this.state.workspace);
        edit(next);
        detachDeletedTasks(next);
        validate(next);
        next.revision = await this.repository.save(next);
        this.emit({ workspace: next });
        success = true;
      } catch (e) {
        this.emit({ error: String(e) });
      } finally {
        this.emit({ pending: this.state.pending - 1 });
      }
    });
    this.tail = run;
    return run.then(() => success);
  };
}
