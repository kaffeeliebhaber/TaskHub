import { Flag, SlidersHorizontal } from "lucide-react";
import { priorities, priorityNames, type Priority } from "../domain/model";
export function PriorityBadge({ priority = "none" }: { priority?: Priority }) {
  return priority === "none" ? null : (
    <span className={`priority-badge priority-${priority}`}>
      <Flag size={11} />
      {priorityNames[priority]}
    </span>
  );
}
export function PriorityFilter({
  value,
  onChange,
}: {
  value: Priority | "all";
  onChange: (v: Priority | "all") => void;
}) {
  return (
    <label
      className={`priority-filter ${value !== "all" ? "filter-active" : ""}`}
    >
      <SlidersHorizontal size={14} />
      <select
        aria-label="Nach Priorität filtern"
        value={value}
        onChange={(e) => onChange(e.target.value as Priority | "all")}
      >
        <option value="all">Alle Prioritäten</option>
        {priorities.map((p) => (
          <option key={p} value={p}>
            {priorityNames[p]}
          </option>
        ))}
      </select>
    </label>
  );
}
