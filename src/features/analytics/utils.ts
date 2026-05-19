import type { TimeSeriesPoint, AnalyticsRange } from "@/types/api";

// ─── Currency Formatter ────────────────────────────────────────────────

export const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// ─── Day Gap-Filler ────────────────────────────────────────────────────

/**
 * Takes a sparsely-dated TimeSeriesPoint array and fills in missing
 * calendar days between the earliest and latest date with zero values,
 * so charts render a continuous axis.
 */
export function fillMissingDays(
  points: TimeSeriesPoint[],
  valueKey: "total" | "count" = "total",
): TimeSeriesPoint[] {
  if (points.length === 0) return [];

  // Parse dates and build lookup
  const dateMap = new Map<string, TimeSeriesPoint>();
  for (const pt of points) {
    dateMap.set(pt.date, pt);
  }

  // Parse all dates to find range
  const parsed = points.map((p) => {
    const d = new Date(p.date);
    if (isNaN(d.getTime())) return null;
    return { date: d, iso: p.date };
  });

  const valid = parsed.filter(
    (p): p is { date: Date; iso: string } => p !== null,
  );
  if (valid.length === 0) return points;

  const timestamps = valid.map((p) => p.date.getTime());
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);

  // Build continuous day array
  const filled: TimeSeriesPoint[] = [];
  const current = new Date(minTs);

  while (current.getTime() <= maxTs) {
    const iso = current.toISOString().split("T")[0]; // YYYY-MM-DD

    if (dateMap.has(iso)) {
      filled.push(dateMap.get(iso)!);
    } else {
      filled.push({ date: iso, [valueKey]: 0 });
    }

    current.setDate(current.getDate() + 1);
  }

  return filled;
}

// ─── Format Date for Axis ──────────────────────────────────────────────

const monthDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatAxisDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return monthDay.format(d);
}

// ─── Chart Colours ─────────────────────────────────────────────────────

export const CHART_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
];

// ─── Multi-Granularity Gap-Filler ───────────────────────────────────────

/**
 * Fills missing periods in a TimeSeriesPoint array based on the selected
 * analytics range, producing continuous axis data for charts.
 *
 * Granularity mapping:
 * - today / yesterday → 24 hourly buckets
 * - 7d / 30d          → daily buckets
 * - 90d               → weekly buckets (7-day intervals)
 * - 1y / all          → monthly buckets
 */
export function fillMissingPeriods(
  points: TimeSeriesPoint[],
  range: AnalyticsRange,
  valueKey: "total" | "count" = "total",
): TimeSeriesPoint[] {
  if (points.length === 0) return [];

  const dateMap = new Map<string, TimeSeriesPoint>();
  for (const pt of points) {
    dateMap.set(pt.date, pt);
  }

  const parsed = points.map((p) => {
    const d = new Date(p.date);
    if (isNaN(d.getTime())) return null;
    return { date: d, iso: p.date };
  });

  const valid = parsed.filter(
    (p): p is { date: Date; iso: string } => p !== null,
  );
  if (valid.length === 0) return points;

  const timestamps = valid.map((p) => p.date.getTime());
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);

  const filled: TimeSeriesPoint[] = [];

  switch (range) {
    // ── Hourly ──────────────────────────────────────────────────────
    case "today":
    case "yesterday": {
      const start = new Date(minTs);
      start.setMinutes(0, 0, 0);
      const end = new Date(maxTs);
      end.setMinutes(0, 0, 0);

      let current = new Date(start);
      while (current.getTime() <= end.getTime()) {
        const iso = current.toISOString().slice(0, 13);
        if (dateMap.has(iso)) {
          filled.push(dateMap.get(iso)!);
        } else {
          filled.push({ date: iso, [valueKey]: 0 });
        }
        current.setHours(current.getHours() + 1);
      }
      break;
    }

    // ── Weekly ─────────────────────────────────────────────────────
    case "90d": {
      const start = new Date(minTs);
      // Align to Monday
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      start.setHours(0, 0, 0, 0);

      const end = new Date(maxTs);

      let current = new Date(start);
      while (current.getTime() <= end.getTime()) {
        const iso = current.toISOString().split("T")[0]; // YYYY-MM-DD
        if (dateMap.has(iso)) {
          filled.push(dateMap.get(iso)!);
        } else {
          filled.push({ date: iso, [valueKey]: 0 });
        }
        current.setDate(current.getDate() + 7);
      }
      break;
    }

    // ── Monthly ────────────────────────────────────────────────────
    case "1y":
    case "all": {
      const start = new Date(minTs);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(maxTs);

      let current = new Date(start);
      while (current.getTime() <= end.getTime()) {
        const iso = current.toISOString().split("T")[0];
        if (dateMap.has(iso)) {
          filled.push(dateMap.get(iso)!);
        } else {
          filled.push({ date: iso, [valueKey]: 0 });
        }
        current.setMonth(current.getMonth() + 1);
      }
      break;
    }

    // ── Daily (default: 7d / 30d) ──────────────────────────────────
    default: {
      const current = new Date(minTs);
      while (current.getTime() <= maxTs) {
        const iso = current.toISOString().split("T")[0];
        if (dateMap.has(iso)) {
          filled.push(dateMap.get(iso)!);
        } else {
          filled.push({ date: iso, [valueKey]: 0 });
        }
        current.setDate(current.getDate() + 1);
      }
      break;
    }
  }

  return filled;
}
