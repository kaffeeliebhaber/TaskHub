import { invoke, isTauri } from "@tauri-apps/api/core";
import { emptyWorkspace, validate, type Workspace } from "../domain/model";
export interface WorkspaceRepository {
  load(): Promise<Workspace>;
  save(state: Workspace): Promise<number>;
  location(): Promise<string>;
  readonly preview: boolean;
}
class DesktopRepository implements WorkspaceRepository {
  readonly preview = false;
  load() {
    return invoke<Workspace>("load_workspace");
  }
  save(workspace: Workspace) {
    return invoke<number>("save_workspace", { workspace });
  }
  location() {
    return invoke<string>("database_path");
  }
}
// Explicit browser preview only. Desktop errors must never silently fall back here.
class PreviewRepository implements WorkspaceRepository {
  readonly preview = true;
  private key = "taskhub-preview-v1";
  async load() {
    const json = localStorage.getItem(this.key);
    const state: Workspace = json ? JSON.parse(json) : emptyWorkspace();
    validate(state);
    return state;
  }
  async save(state: Workspace) {
    validate(state);
    if ((await this.load()).revision !== state.revision)
      throw new Error(
        "Die Vorschau wurde in einem anderen Tab geändert. Bitte neu laden.",
      );
    const revision = state.revision + 1;
    localStorage.setItem(this.key, JSON.stringify({ ...state, revision }));
    return revision;
  }
  async location() {
    return "Browser-Vorschau · separat im lokalen Browserspeicher";
  }
}
export const repository: WorkspaceRepository = isTauri()
  ? new DesktopRepository()
  : new PreviewRepository();
