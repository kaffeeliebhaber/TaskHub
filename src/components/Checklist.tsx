import { useState } from "react";
import { ChevronRight, Plus, Check, X, ListChecks } from "lucide-react";
import { id, type Checklist as ChecklistModel } from "../domain/model";
export function Checklist({
  value,
  update,
}: {
  value?: ChecklistModel | null;
  update: (edit: (list: ChecklistModel) => void) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (edit: (list: ChecklistModel) => void) => {
    setBusy(true);
    try {
      return await update(edit);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="checklist"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {!value ? (
        <button
          className="add-checklist"
          onClick={() => void run(() => {})}
          disabled={busy}
        >
          <ListChecks size={14} />
          Checkliste hinzufügen
        </button>
      ) : (
        <>
          <button
            className="checklist-toggle"
            aria-expanded={!value.collapsed}
            disabled={busy}
            onClick={() =>
              void run((list) => {
                list.collapsed = !list.collapsed;
              })
            }
          >
            <ChevronRight
              size={14}
              className={value.collapsed ? "" : "rotated"}
            />
            <span>{value.title}</span>
            <small>
              {value.items.filter((i) => i.done).length}/{value.items.length}
            </small>
          </button>
          <div
            className="checklist-progress"
            role="progressbar"
            aria-label={`Fortschritt ${value.title}`}
            aria-valuemin={0}
            aria-valuemax={Math.max(1, value.items.length)}
            aria-valuenow={value.items.filter((i) => i.done).length}
          >
            <span
              style={{
                width: `${value.items.length ? (value.items.filter((i) => i.done).length / value.items.length) * 100 : 0}%`,
              }}
            />
          </div>
          <div
            className={`checklist-fold ${value.collapsed ? "" : "expanded"}`}
            inert={value.collapsed}
            aria-hidden={value.collapsed}
          >
            <div>
              <div className="checklist-body">
                <input
                  className="checklist-name"
                  aria-label="Name der Checkliste"
                  key={value.title}
                  defaultValue={value.title}
                  maxLength={120}
                  disabled={busy}
                  onBlur={(e) => {
                    const title = e.target.value.trim();
                    if (title && title !== value.title)
                      void run((list) => {
                        list.title = title;
                      });
                    else e.target.value = value.title;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
                {value.items.map((item) => (
                  <div className="checklist-item" key={item.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.done}
                        disabled={busy}
                        onChange={() =>
                          void run((list) => {
                            const target = list.items.find(
                              (i) => i.id === item.id,
                            );
                            if (target) target.done = !target.done;
                          })
                        }
                      />
                      <span className="check-box">
                        <Check size={11} />
                      </span>
                      <span className={item.done ? "done" : ""}>
                        {item.text}
                      </span>
                    </label>
                    <button
                      className="remove-item"
                      aria-label={`Eintrag ${item.text} entfernen`}
                      disabled={busy}
                      onClick={() =>
                        void run((list) => {
                          list.items = list.items.filter(
                            (i) => i.id !== item.id,
                          );
                        })
                      }
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <form
                  className="checklist-add"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const text = draft.trim();
                    if (value.items.length >= 200) return;
                    if (
                      text &&
                      (await run((list) => {
                        list.items.push({ id: id(), text, done: false });
                      }))
                    )
                      setDraft("");
                  }}
                >
                  <input
                    aria-label="Neuer Checklisteneintrag"
                    placeholder="Eintrag hinzufügen …"
                    value={draft}
                    maxLength={300}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button
                    aria-label="Checklisteneintrag hinzufügen"
                    disabled={
                      busy || !draft.trim() || value.items.length >= 200
                    }
                  >
                    <Plus size={15} />
                  </button>
                </form>
                {!value.items.length && (
                  <p className="checklist-hint">
                    Was gehört zu dieser Aufgabe?
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
