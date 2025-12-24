"use client";

import { cn } from "@/lib/utils";
import { TimeRange } from "@/lib/timeRangeUtils";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  className?: string;
}

const options: { label: string; value: TimeRange }[] = [
  { label: "24h", value: "24h" },
  { label: "1W", value: "7d" },
  { label: "1M", value: "30d" },
  { label: "3M", value: "90d" },
  { label: "All", value: "all" },
];

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div className={cn("flex items-center bg-white/5 rounded-lg p-1 gap-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-2 py-1 text-[10px] font-medium rounded transition-all",
            value === opt.value
              ? "bg-white/20 text-white shadow-sm"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
