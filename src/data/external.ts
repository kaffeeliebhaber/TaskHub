import { invoke, isTauri } from "@tauri-apps/api/core";
import { safeUrl } from "../domain/taskTools";
export async function openExternal(url: string) {
  if (!safeUrl(url)) throw Error("Nur HTTP- und HTTPS-Links sind erlaubt.");
  if (isTauri()) await invoke("open_external", { url });
  else window.open(url, "_blank", "noopener,noreferrer");
}
export async function exportCanvas(canvas: object): Promise<string> {
  const content = JSON.stringify(canvas, null, 2);
  if (isTauri()) return invoke<string>("export_canvas", { content });
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "TaskHub.canvas";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "TaskHub.canvas wurde zum Download bereitgestellt. Lege die Datei in deinen Obsidian-Vault und öffne sie dort.";
}
