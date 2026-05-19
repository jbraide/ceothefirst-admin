import type { AnalyticsRange } from "@/types/api";
import { cn } from "@/utils/cn";

interface RangeSelectorProps {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
  className?: string;
}

const RANGES: { label: string; value: AnalyticsRange }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
];

export default function RangeSelector({
  value,
  onChange,
  className,
}: RangeSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === r.value
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
