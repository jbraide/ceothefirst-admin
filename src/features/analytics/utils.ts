import type { TimeSeriesPoint, AnalyticsRange } from "@/types/api";

// ─── Currency Formatter ────────────────────────────────────────────────

export const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// ─── Format Date for Axis ──────────────────────────────────────────────

const monthDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

const hourOnly = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Formats a date string for chart axis display, adapting to the range.
 *
 * - today / yesterday → hour labels (e.g. "00:00", "14:00")
 * - 7d / 30d          → day labels (e.g. "May 12")
 * - 90d               → ISO week labels (e.g. "W21" or "May 19")
 * - 1y / all          → month labels (e.g. "May 2026")
 */
export function formatAxisDate(
  dateStr: string,
  range?: AnalyticsRange,
): string {
  // Weekly bucket: date stored as ISO week start (YYYY-MM-DD)
  if (range === "90d") {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    // Show week-start date, e.g. "May 19"
    return monthDay.format(d);
  }

  // Monthly bucket: date stored as YYYY-MM
  if (range === "1y" || range === "all") {
    // dateStr is either "YYYY-MM" or "YYYY-MM-DD"
    const [year, month] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    if (isNaN(d.getTime())) return dateStr;
    return monthYear.format(d);
  }

  // Hourly bucket: dateStr is ISO hour like "2026-05-15T14"
  if (range === "today" || range === "yesterday") {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Try parsing ISO hour string directly
      const match = dateStr.match(/T(\d{2})(?::(\d{2}))?/);
      if (match) return `${match[1]}:${match[2] ?? "00"}`;
      return dateStr;
    }
    return hourOnly.format(d);
  }

  // Daily (default: 7d / 30d)
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
 * For weekly and monthly ranges, raw daily data is aggregated into
 * the appropriate bucket before gap-filling.
 *
 * Granularity mapping:
 * - today / yesterday → 24 hourly buckets
 * - 7d / 30d          → daily buckets
 * - 90d               → weekly buckets (Mon–Sun, ~13 weeks)
 * - 1y / all          → monthly buckets (12 / N months)
 */
export function fillMissingPeriods(
  points: TimeSeriesPoint[],
  range: AnalyticsRange,
  valueKey: "total" | "count" = "total",
): TimeSeriesPoint[] {
  if (points.length === 0) return [];

  const parsed = points.map((p) => {
    const d = new Date(p.date);
    if (isNaN(d.getTime())) return null;
    return { val: p[valueKey] ?? 0, date: d };
  });

  const valid = parsed.filter(
    (p): p is { val: number; date: Date } => p !== null,
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
      // Build a map keyed by ISO hour (e.g. "2026-05-15T14")
      const hourMap = new Map<string, number>();
      for (const pt of valid) {
        const key = pt.date.toISOString().slice(0, 13);
        hourMap.set(key, (hourMap.get(key) ?? 0) + pt.val);
      }

      const start = new Date(minTs);
      start.setMinutes(0, 0, 0);
      const end = new Date(maxTs);
      end.setMinutes(0, 0, 0);

      const current = new Date(start);
      while (current.getTime() <= end.getTime()) {
        const iso = current.toISOString().slice(0, 13);
        filled.push({ date: iso, [valueKey]: hourMap.get(iso) ?? 0 });
        current.setHours(current.getHours() + 1);
      }
      break;
    }

    // ── Weekly (90d) ───────────────────────────────────────────────
    case "90d": {
      // Aggregate raw daily data into ISO-week buckets keyed by Monday date
      const weekMap = new Map<string, number>();
      for (const pt of valid) {
        const day = pt.date.getDay();
        const diff = day === 0 ? -6 : 1 - day; // days back to Monday
        const monday = new Date(pt.date);
        monday.setDate(monday.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        const key = monday.toISOString().split("T")[0]; // YYYY-MM-DD
        weekMap.set(key, (weekMap.get(key) ?? 0) + pt.val);
      }

      // Determine full Monday-aligned range
      const start = new Date(minTs);
      const startDay = start.getDay();
      const startDiff = startDay === 0 ? -6 : 1 - startDay;
      start.setDate(start.getDate() + startDiff);
      start.setHours(0, 0, 0, 0);

      const end = new Date(maxTs);

      const current = new Date(start);
      while (current.getTime() <= end.getTime()) {
        const iso = current.toISOString().split("T")[0];
        filled.push({ date: iso, [valueKey]: weekMap.get(iso) ?? 0 });
        current.setDate(current.getDate() + 7);
      }
      break;
    }

    // ── Monthly (1y / all) ─────────────────────────────────────────
    case "1y":
    case "all": {
      // Aggregate raw daily data into YYYY-MM buckets
      const monthMap = new Map<string, number>();
      for (const pt of valid) {
        const key = `${pt.date.getFullYear()}-${String(pt.date.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, (monthMap.get(key) ?? 0) + pt.val);
      }

      // Determine full month-aligned range
      const start = new Date(minTs);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(maxTs);

      const current = new Date(start);
      while (current.getTime() <= end.getTime()) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        filled.push({ date: key, [valueKey]: monthMap.get(key) ?? 0 });
        current.setMonth(current.getMonth() + 1);
      }
      break;
    }

    // ── Daily (default: 7d / 30d) ──────────────────────────────────
    default: {
      // Build a map keyed by YYYY-MM-DD
      const dayMap = new Map<string, number>();
      for (const pt of valid) {
        const key = pt.date.toISOString().split("T")[0];
        dayMap.set(key, (dayMap.get(key) ?? 0) + pt.val);
      }

      const current = new Date(minTs);
      while (current.getTime() <= maxTs) {
        const iso = current.toISOString().split("T")[0];
        filled.push({ date: iso, [valueKey]: dayMap.get(iso) ?? 0 });
        current.setDate(current.getDate() + 1);
      }
      break;
    }
  }

  return filled;
}
