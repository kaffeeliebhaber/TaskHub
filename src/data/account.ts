import { invoke, isTauri } from "@tauri-apps/api/core";
export type User = { id: string; name: string; avatar?: string | null };
export async function api<T>(path: string, body?: unknown): Promise<T> {
  if (isTauri()) return invoke<T>("profile_api", { path, body: body ?? null });
  const response = await fetch(`/api/${path}`, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", headers: body === undefined ? {} : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const value = await response.json(); if (!response.ok) throw Error(value.error || "Anfrage fehlgeschlagen."); return value;
}
