import { MessageSquareText } from "lucide-react";
import type { FocusNote } from "../domain/focus";
export function FocusNotes({
  notes,
  compact = false,
}: {
  notes: FocusNote[];
  compact?: boolean;
}) {
  if (!notes.length) return null;
  const sorted = [...notes].reverse();
  return (
    <details
      className={`focus-notes ${compact ? "compact-notes" : ""}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <summary>
        <MessageSquareText size={13} />
        <span>Focus-Notizen</span>
        <small>{notes.length}</small>
      </summary>
      {sorted.map((n) => (
        <div className="saved-note" key={n.id}>
          <time dateTime={n.createdAt}>
            {new Date(n.createdAt).toLocaleString("de-DE", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </time>
          <p>{n.text}</p>
        </div>
      ))}
    </details>
  );
}
