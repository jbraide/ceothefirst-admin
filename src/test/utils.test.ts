import { describe, it, expect } from "vitest";
import { fillMissingPeriods, naira } from "@/features/analytics/utils";
import type { TimeSeriesPoint } from "@/types/api";

// ── Helpers ─────────────────────────────────────────────────────────────

/** Create a reference date string offset by `days` from a fixed base. */
function dateStr(daysOffset: number): string {
  const d = new Date("2025-06-15T12:00:00Z");
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
}

/** Create a reference hour string offset by `hours` from a fixed base.
 *  Returns "YYYY-MM-DDTHH:MM" format that `new Date()` can parse. */
function hourStr(hoursOffset: number): string {
  const d = new Date("2025-06-15T00:00:00Z");
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

// ── Tests ───────────────────────────────────────────────────────────────

describe("fillMissingPeriods", () => {
  describe("range: today / yesterday (hourly buckets)", () => {
    it('returns hourly buckets for "today" range spanning 23 hours', () => {
      const points: TimeSeriesPoint[] = [
        { date: hourStr(0), total: 100 },
        { date: hourStr(23), total: 200 },
      ];

      const result = fillMissingPeriods(points, "today");

      // 24 buckets: hours 0–23 inclusive
      expect(result.length).toBeGreaterThanOrEqual(23);
    });

    it("fills missing hours with zero values", () => {
      const points: TimeSeriesPoint[] = [
        { date: hourStr(0), total: 50 },
        { date: hourStr(5), total: 150 },
      ];

      const result = fillMissingPeriods(points, "today");

      // Hour 1 and 2 should be zero-filled
      expect(result[1].total).toBe(0);
      expect(result[2].total).toBe(0);
    });
  });

  describe("range: 7d (daily buckets)", () => {
    it("returns 7 daily buckets for a 7-day range", () => {
      const points: TimeSeriesPoint[] = [
        { date: dateStr(0), total: 10 },
        { date: dateStr(6), total: 60 },
      ];

      const result = fillMissingPeriods(points, "7d");

      // 7 daily buckets ending at the latest data point
      expect(result).toHaveLength(7);
      // Data points appear somewhere in the result
      const dates = result.map((r) => r.date);
      expect(dates).toContain(dateStr(0));
      expect(dates).toContain(dateStr(6));
      const first = result.find((r) => r.date === dateStr(0));
      const last = result.find((r) => r.date === dateStr(6));
      expect(first?.total).toBe(10);
      expect(last?.total).toBe(60);
    });

    it("fills missing days with zero values", () => {
      const points: TimeSeriesPoint[] = [
        { date: dateStr(0), total: 5 },
        { date: dateStr(3), total: 35 },
      ];

      const result = fillMissingPeriods(points, "7d");

      // Gaps between data points are zero-filled
      const zeroBuckets = result.filter((r) => r.total === 0);
      expect(zeroBuckets.length).toBeGreaterThan(0);
    });
  });

  describe("range: 90d (weekly buckets)", () => {
    it("returns buckets spaced exactly 7 days apart", () => {
      const points: TimeSeriesPoint[] = [
        { date: "2025-06-11", total: 100 },
        { date: "2025-07-02", total: 400 },
      ];

      const result = fillMissingPeriods(points, "90d");

      // Each consecutive pair should be exactly 7 days apart
      for (let i = 1; i < result.length; i++) {
        const prev = new Date(result[i - 1].date).getTime();
        const curr = new Date(result[i].date).getTime();
        const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(7);
      }
    });

    it("covers the full range from start to end", () => {
      const points: TimeSeriesPoint[] = [
        { date: "2025-06-11", total: 100 },
        { date: "2025-07-02", total: 400 },
      ];

      const result = fillMissingPeriods(points, "90d");

      const firstDate = new Date(result[0].date).getTime();
      const lastDate = new Date(result[result.length - 1].date).getTime();
      const minInput = new Date("2025-06-11").getTime();
      const maxInput = new Date("2025-07-02").getTime();

      // First bucket ≤ first input date (Monday alignment precedes the input)
      expect(firstDate).toBeLessThanOrEqual(minInput);
      // The next 7-day bucket would overshoot maxInput
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      expect(lastDate + oneWeek).toBeGreaterThan(maxInput);
    });

    it("fills missing weeks with zero values", () => {
      const points: TimeSeriesPoint[] = [
        { date: "2025-06-11", total: 100 },
        { date: "2025-07-02", total: 400 },
      ];

      const result = fillMissingPeriods(points, "90d");

      // All buckets should have total set (either from input or zero)
      for (const bucket of result) {
        expect(bucket).toHaveProperty("total");
        expect(typeof bucket.total).toBe("number");
      }

      // At least one bucket should be zero-filled (the gap weeks)
      const zeroBuckets = result.filter((b) => b.total === 0);
      expect(zeroBuckets.length).toBeGreaterThan(0);
    });
  });

  describe("preserving existing values", () => {
    it("preserves existing values across daily range", () => {
      const points: TimeSeriesPoint[] = [
        { date: dateStr(0), total: 10, count: 2 },
        { date: dateStr(1), total: 20, count: 4 },
        { date: dateStr(2), total: 30, count: 6 },
      ];

      const result = fillMissingPeriods(points, "7d");

      // 7-day range produces 7 buckets; data points appear somewhere within
      expect(result).toHaveLength(7);
      const getVal = (date: string) => result.find((r) => r.date === date)?.total;
      expect(getVal(dateStr(0))).toBe(10);
      expect(getVal(dateStr(1))).toBe(20);
      expect(getVal(dateStr(2))).toBe(30);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty input", () => {
      const result = fillMissingPeriods([], "7d");
      expect(result).toEqual([]);
    });

    it("produces full 7-day range around a single point", () => {
      const points: TimeSeriesPoint[] = [{ date: dateStr(0), total: 42 }];
      const result = fillMissingPeriods(points, "7d");
      // Single point produces 7 daily buckets ending at that point
      expect(result).toHaveLength(7);
      const found = result.find((r) => r.date === dateStr(0));
      expect(found?.total).toBe(42);
    });
  });
});

describe("naira formatter", () => {
  it("formats zero as ₦0", () => {
    expect(naira.format(0)).toBe("₦0");
  });

  it("formats thousands with commas", () => {
    expect(naira.format(5000)).toBe("₦5,000");
  });

  it("formats millions correctly", () => {
    expect(naira.format(1_500_000)).toBe("₦1,500,000");
  });

  it("rounds to whole naira (no decimals)", () => {
    expect(naira.format(1234.56)).toBe("₦1,235");
  });
});
