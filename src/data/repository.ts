import { api } from "./account";
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
    return api<Workspace>("workspace");
  }
  save(workspace: Workspace) {
    return api<number>("workspace", workspace);
  }
  location() {
    return api<string>("location");
  }
}
class PreviewRepository implements WorkspaceRepository {
  readonly preview = true;
  load() {
    return api<Workspace>("workspace");
  }
  save(state: Workspace) {
    return api<number>("workspace", state);
  }
  async location() {
    return "Lokale SQLite-Datenbank";
  }
}
export const repository: WorkspaceRepository = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window ? new DesktopRepository() : new PreviewRepository();
