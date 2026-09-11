import { openExternal } from "../data/external";
import { useState } from "react";
import {
  id,
  type Task,
  type TaskDetails as Details,
  type Workspace,
} from "../domain/model";
import { canDepend, safeUrl } from "../domain/taskTools";
export function TaskDetails({
  task,
  workspace,
  value,
  onChange,
  onBusy,
}: {
  onBusy: (busy: boolean) => void;
  task: Task;
  workspace: Workspace;
  value: Details;
  onChange: (d: Details) => void;
}) {
  const [url, setUrl] = useState(""),
    [issue, setIssue] = useState("");
  const patch = (p: Partial<Details>) => onChange({ ...value, ...p });
  const readImage = async (file: File) => {
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      )
    )
      throw Error("Bitte PNG, JPEG, WebP oder GIF wählen.");
    if (file.size > 2 * 1024 * 1024) throw Error("Maximal 2 MB je Bild.");
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(Error("Bild konnte nicht gelesen werden."));
      reader.readAsDataURL(file);
    });
    return { id: id(), name: file.name, data };
  };
  return (
    <section className="task-extras">
      <label className="check-label">
        <input
          type="checkbox"
          checked={!!value.closedAt}
          onChange={(e) =>
            patch({
              closedAt: e.target.checked ? new Date().toISOString() : null,
            })
          }
        />{" "}
        Aufgabe abgeschlossen
      </label>
      {value.closedAt && (
        <small>
          Geschlossen am {new Date(value.closedAt).toLocaleString("de-DE")}
        </small>
      )}
      <h3>Abhängigkeiten</h3>
      <p className="muted">Diese Aufgabe wartet auf:</p>
      {(value.dependencies ?? []).map((depId) => {
        const dep = workspace.tasks.find((t) => t.id === depId);
        return (
          <div className="dependency" key={depId}>
            <span>
              {dep?.details?.closedAt ? "✓ Freigegeben" : "↳ Wartet auf"} ·{" "}
              {dep?.title ?? "Entfernte Aufgabe"}
            </span>
            <button
              type="button"
              aria-label="Abhängigkeit entfernen"
              onClick={() =>
                patch({
                  dependencies: value.dependencies?.filter((x) => x !== depId),
                })
              }
            >
              ×
            </button>
          </div>
        );
      })}
      <select
        aria-label="Abhängigkeit hinzufügen"
        value=""
        onChange={(e) =>
          patch({
            dependencies: [...(value.dependencies ?? []), e.target.value],
          })
        }
      >
        <option value="">Voraussetzung hinzufügen …</option>
        {workspace.tasks
          .filter(
            (t) =>
              !t.details?.archivedAt &&
              !(value.dependencies ?? []).includes(t.id) &&
              canDepend(workspace, task.id, t.id),
          )
          .map((t) => (
            <option value={t.id} key={t.id}>
              {t.title}
            </option>
          ))}
      </select>
      <h3>Links</h3>
      {value.links?.map((l) => (
        <div className="dependency" key={l.id}>
          <a
            href={l.url}
            onClick={(e) => {
              e.preventDefault();
              void openExternal(l.url).catch((error) =>
                window.alert(String(error)),
              );
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {l.title}
          </a>
          <button
            type="button"
            aria-label="Link entfernen"
            onClick={() =>
              patch({ links: value.links?.filter((x) => x.id !== l.id) })
            }
          >
            ×
          </button>
        </div>
      ))}
      <div className="extra-row">
        <input
          aria-label="URL"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          disabled={!safeUrl(url)}
          onClick={() => {
            patch({
              links: [
                ...(value.links ?? []),
                { id: id(), url, title: new URL(url).hostname },
              ],
            });
            setUrl("");
          }}
        >
          Hinzufügen
        </button>
      </div>
      <h3>Bilder</h3>
      <p className="muted">
        Bis zu 6 Bilder, jeweils maximal 2 MB. Bilder werden lokal gespeichert.
      </p>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        aria-label="Bilder hinzufügen"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          setIssue("");
          onBusy(true);
          try {
            if ((value.images?.length ?? 0) + files.length > 6)
              throw Error("Maximal 6 Bilder pro Aufgabe.");
            const images = await Promise.all(files.map(readImage));
            patch({ images: [...(value.images ?? []), ...images] });
          } catch (error) {
            setIssue(String(error));
          } finally {
            onBusy(false);
          }
        }}
      />
      {issue && <p role="alert">{issue}</p>}
      <div className="task-image-grid">
        {value.images?.map((img) => (
          <figure key={img.id}>
            <img src={img.data} alt={img.name} />
            <figcaption>{img.name}</figcaption>
            <button
              type="button"
              onClick={() =>
                patch({ images: value.images?.filter((x) => x.id !== img.id) })
              }
            >
              Entfernen
            </button>
          </figure>
        ))}
      </div>
    </section>
  );
}
