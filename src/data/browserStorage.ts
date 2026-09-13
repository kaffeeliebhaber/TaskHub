import { emptyWorkspace, validate, type Workspace } from "../domain/model";
const legacyKey = "taskhub-preview-v1";
let opening: Promise<IDBDatabase> | undefined;
function database() {
  return (opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("taskhub-preview", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("workspace");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}
export async function loadBrowserWorkspace(): Promise<Workspace> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("workspace", "readonly");
    const req = tx.objectStore("workspace").get("current");
    req.onsuccess = () => {
      try {
        const legacy = localStorage.getItem(legacyKey);
        const state: Workspace =
          req.result ?? (legacy ? JSON.parse(legacy) : emptyWorkspace());
        validate(state);
        resolve(state);
      } catch (e) {
        reject(e);
      }
    };
    req.onerror = () => reject(req.error);
  });
}
export async function saveBrowserWorkspace(state: Workspace): Promise<number> {
  validate(state);
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("workspace", "readwrite"),
      store = tx.objectStore("workspace");
    let issue: unknown;
    const request = store.get("current");
    request.onsuccess = () => {
      try {
        const legacy = localStorage.getItem(legacyKey);
        const previous: Workspace =
          request.result ?? (legacy ? JSON.parse(legacy) : emptyWorkspace());
        if (previous.revision !== state.revision)
          throw Error(
            "Die Vorschau wurde in einem anderen Tab geändert. Bitte neu laden.",
          );
        store.put({ ...state, revision: state.revision + 1 }, "current");
      } catch (e) {
        issue = e;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(state.revision + 1);
    tx.onerror = () => reject(issue ?? tx.error);
    tx.onabort = () =>
      reject(issue ?? tx.error ?? Error("Speichern abgebrochen."));
  });
}
