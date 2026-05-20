# QA Review — Chart Y-Axis Dynamic Scaling & Data Loss

**Date:** 2026-05-20  
**Reviewer:** QA Specialist  
**Scope:** Analytics time-series charts (Revenue, Signups, Transactions Volume)  
**Verdict:** 🔴 BLOCK — two confirmed bugs, one file each

---

## 🔴 Bug 1: `domain={[0, "auto"]}` is not a valid Recharts value

**Files:**
- `src/features/analytics/components/RevenueChart.tsx:112`
- `src/features/analytics/components/SignupsChart.tsx:103`
- `src/features/analytics/components/TransactionsVolumeChart.tsx:147,157`

**What's happening:** Every chart YAxis uses `domain={[0, "auto"]}`, but Recharts does **not** recognize the string `"auto"` as a valid domain value. It silently ignores it and falls back to its default tick-based domain calculation — which rounds to "nice" numbers based on tick count, completely ignoring the actual data max.

This is why 7d/30d/90d all cap at ~8k regardless of data values. The tick algorithm picks a nice round number like 8000 and Recharts never sees the 300k data points when determining the domain.

**Valid Recharts `domain` values:**
| Value | Meaning |
|-------|---------|
| `"dataMin"` | Use the minimum data value |
| `"dataMax"` | Use the maximum data value |
| `(dataMin) => number` | Function returning custom min |
| `(dataMax) => number` | Function returning custom max |
| `number` | Hardcoded value |
| `"auto"` | ❌ Not recognized — silently ignored |

**Fix:** Replace `"auto"` with `"dataMax"` on every YAxis:

```tsx
// Before (broken)
domain={[0, "auto"]}

// After (correct)
domain={[0, "dataMax"]}
```

Three occurrences across three files:

```tsx
// RevenueChart.tsx:112
<YAxis type="number" domain={[0, "dataMax"]} ... />

// SignupsChart.tsx:103
<YAxis type="number" domain={[0, "dataMax"]} ... />

// TransactionsVolumeChart.tsx:147 (left axis)
<YAxis yAxisId="left" type="number" domain={[0, "dataMax"]} ... />

// TransactionsVolumeChart.tsx:157 (right axis)
<YAxis yAxisId="right" type="number" domain={[0, "dataMax"]} ... />
```

---

## 🔴 Bug 2: TransactionsVolumeChart — `total` field wiped to zero

**File:** `src/features/analytics/components/TransactionsVolumeChart.tsx:115-118`

```ts
const filled = fillMissingPeriods(data, range, "count").map((p) => ({
    ...p,
    total: p.total ?? 0,
}));
```

**What's happening:** `fillMissingPeriods` is called with `valueKey: "count"`. This means every entry in the output array has only `{ date, count }` — the original `total` field is **discarded**. Then the `.map()` does `total: p.total ?? 0`, which sets `total` to 0 for **every single entry** since `p.total` is always `undefined`.

The `Line` component at line 177 reads `dataKey="total"` — so the revenue line is always flat at ₦0. Visible data only appears when a data point happens to have both count and total from the original (which fillMissingPeriods drops).

**Fix — option A (simplest):** Run `fillMissingPeriods` twice, once for each key:

```ts
const filled = fillMissingPeriods(data, range, "count").map((p, i) => {
    const byTotal = fillMissingPeriods(data, range, "total");
    return { ...p, total: byTotal[i]?.total ?? 0 };
});
```

**Fix — option B (cleaner):** Modify `fillMissingPeriods` to accept multiple value keys and preserve all of them through aggregation and gap-filling. Not scope of this review but recommended long-term.

---

## 🟡 Consistency: Mixed chart types

**Files:**
- `src/features/analytics/components/RevenueChart.tsx` — `LineChart`
- `src/features/analytics/components/SignupsChart.tsx` — `BarChart`  
- `src/features/analytics/components/TransactionsVolumeChart.tsx` — `ComposedChart` (Bar + Line)

The user wants consistent line charts across all time-series views. The BarChart for signups and the ComposedChart for transactions volume should become LineCharts (or at minimum, Signups should be a LineChart for visual consistency).

---

## Summary

| Issue | File | Fix |
|-------|------|-----|
| Y-axis stuck at 8k for all ranges | 3 chart files | `"auto"` → `"dataMax"` (3 occurrences) |
| TransactionsVolume revenue line flat at ₦0 | `TransactionsVolumeChart.tsx:115` | Preserve `total` through fill or call fill twice |
| Mixed chart types | 2 chart files | Switch Signups to `LineChart` |

**Two one-liner fixes and one structural fix.** The `"auto"` → `"dataMax"` change alone will fix the Y-axis scaling for RevenueChart and SignupsChart immediately.
