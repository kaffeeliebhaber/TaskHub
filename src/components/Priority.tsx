import { Check, ChevronDown, Flag, SlidersHorizontal } from "lucide-react";
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
  const options: Array<{ value: Priority | "all"; label: string }> = [
    { value: "all", label: "Alle Prioritäten" },
    { value: "none", label: "Keine Priorität" },
    ...priorities
      .filter((priority) => priority !== "none")
      .map((priority) => ({ value: priority, label: priorityNames[priority] })),
  ];
  const current = options.find((option) => option.value === value)!;
  return (
    <details
      className={`priority-filter ${value !== "all" ? "filter-active" : ""}`}
    >
      <summary aria-label={`Prioritätsfilter: ${current.label}`}>
        <SlidersHorizontal size={14} />
        <span>{current.label}</span>
        <ChevronDown size={13} />
      </summary>
      <div className="priority-filter-menu" role="menu">
        {options.map((option) => (
          <button
            type="button"
            role="menuitemradio"
            aria-checked={option.value === value}
            key={option.value}
            onClick={(event) => {
              onChange(option.value);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            <span className={`filter-dot priority-${option.value}`} />
            {option.label}
            {option.value === value && <Check size={13} />}
          </button>
        ))}
      </div>
    </details>
  );
}
