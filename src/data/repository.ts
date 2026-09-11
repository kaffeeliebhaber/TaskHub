import { loadBrowserWorkspace, saveBrowserWorkspace } from "./browserStorage";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { type Workspace } from "../domain/model";
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
  load() {
    return loadBrowserWorkspace();
  }
  save(state: Workspace) {
    return saveBrowserWorkspace(state);
  }
  async location() {
    return "Browser-Vorschau · separat im lokalen Browserspeicher";
  }
}
export const repository: WorkspaceRepository = isTauri()
  ? new DesktopRepository()
  : new PreviewRepository();
