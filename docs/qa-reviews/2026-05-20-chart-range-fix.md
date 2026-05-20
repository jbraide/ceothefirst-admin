# QA Review — Chart Range & Display Issues

**Date:** 2026-05-20  
**Reviewer:** QA Specialist  
**Scope:** Analytics time-series charts (Revenue, Signups, Transactions Volume)  
**Verdict:** 🔴 BLOCK — single root cause affecting all ranges

---

## Root Cause

`fillMissingPeriods` in `src/features/analytics/utils.ts` computes the chart range from **the earliest data point returned by the API** (`minTs`), not from the selected analytics range.

Every range branch follows this pattern:

```ts
const start = new Date(minTs);  // ← BUG: uses earliest data point, not range start
```

This means if the API returns data for only a narrow window, the chart shows only that window — not the full range the user selected.

---

## 🔴 Blockers

### 1. All time ranges produce truncated charts

**File:** `src/features/analytics/utils.ts` — `fillMissingPeriods()`

Every range branch (`today/yesterday`, `90d`, `1y/all`, `7d/30d`) starts from `minTs` instead of the appropriate range boundary. Fix: calculate `start` from `maxTs` (or `now`) minus the range duration.

| Range | Current behavior | Expected behavior |
|-------|-----------------|-------------------|
| **Today** | Hours from earliest API data hour to latest | Full 24 hours (00:00–23:00) of today |
| **Yesterday** | Same — truncated hourly range | Full 24 hours of yesterday |
| **7d** | Days from first to last data point (could be 2–3 days) | Always 7 days back from today |
| **30d** | Same problem — might show 10–15 days | Always 30 days back from today |
| **90d** | Weeks from first to last data week | Always ~13 weeks back from today |
| **1y** | Months from first to last data month (could be 1–2 dots) | Always 12 months back from today |
| **all** | Correct — should span full data range | Keep as-is |

**Suggested fix — per-range start calculation:**

```ts
// Compute rangeEnd from maxTs (latest data point is the anchor)
const rangeEnd = new Date(maxTs);

let rangeStart: Date;

switch (range) {
  case "today": {
    rangeStart = new Date(rangeEnd);
    rangeStart.setHours(0, 0, 0, 0);
    break;
  }
  case "yesterday": {
    rangeStart = new Date(rangeEnd);
    rangeStart.setDate(rangeStart.getDate() - 1);
    rangeStart.setHours(0, 0, 0, 0);
    // Adjust rangeEnd to yesterday at 23:00
    rangeEnd.setDate(rangeEnd.getDate() - 1);
    rangeEnd.setHours(23, 0, 0, 0);
    break;
  }
  case "7d": {
    rangeStart = new Date(rangeEnd);
    rangeStart.setDate(rangeStart.getDate() - 6);
    rangeStart.setHours(0, 0, 0, 0);
    break;
  }
  case "30d": {
    rangeStart = new Date(rangeEnd);
    rangeStart.setDate(rangeStart.getDate() - 29);
    rangeStart.setHours(0, 0, 0, 0);
    break;
  }
  case "90d": {
    rangeStart = new Date(rangeEnd);
    rangeStart.setDate(rangeStart.getDate() - 89);
    // Align to Monday
    const day = rangeStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    rangeStart.setDate(rangeStart.getDate() + diff);
    rangeStart.setHours(0, 0, 0, 0);
    break;
  }
  case "1y": {
    rangeStart = new Date(rangeEnd);
    rangeStart.setMonth(rangeStart.getMonth() - 11);
    rangeStart.setDate(1);
    rangeStart.setHours(0, 0, 0, 0);
    break;
  }
  case "all":
  default: {
    rangeStart = new Date(minTs);
    break;
  }
}
```

Then use `rangeStart` instead of `start` in each branch's loop.

---

### 2. "Today" not loading at all

**File:** `src/features/analytics/utils.ts`

Secondary issue: the "today" hourly bucket uses `current.toISOString().slice(0, 13)`, producing keys like `"2026-05-20T14"`. If the API returns dates in a different format (e.g., `"2026-05-20T14:00:00.000Z"`), the hour map lookup will never match, resulting in all zeros.

This may be exacerbated by the fact that with `minTs`-based range, if `minTs` and `maxTs` are within the same hour, only 1 bucket is produced.

**Suggested fix:** Ensure both the map key and bucket key use the same ISO hour format. Consider normalizing the API date to local time before slicing.

---

### 3. Y-axis max stuck at 8k for 7d/30d/90d

**File:** `src/features/analytics/components/RevenueChart.tsx`  
**File:** `src/features/analytics/components/SignupsChart.tsx`  
**File:** `src/features/analytics/components/TransactionsVolumeChart.tsx`

These charts already have `domain={[0, "auto"]}` (added in commit `827b2ad`), which should dynamically scale the Y-axis. But because the chart data is truncated (issue #1), the highest visible data point may genuinely be 8k. The data above 8k exists in the API response but falls outside the truncated `minTs`–`maxTs` window and gets excluded.

**This is a symptom of issue #1, not a separate bug.** Fixing the range calculation should resolve this automatically.

---

### 4. 1yr shows "just a dot"

**File:** `src/features/analytics/utils.ts` — monthly branch

Monthly aggregation works correctly:
```ts
const key = `${pt.date.getFullYear()}-${String(pt.date.getMonth() + 1).padStart(2, "0")}`;
```

But `start` is set to the earliest month with data, and the loop runs `start` → `maxTs`. If API data spans only 1–2 months, only 1–2 buckets are produced.

**Same root cause as #1.** With the fix, the chart will always produce 12 monthly buckets for "1y".

---

## Summary

All 5 reported issues stem from a single bug: `fillMissingPeriods` anchors the range to the earliest data point instead of enforcing the full selected period. The `domain={[0, "auto"]}` fix from `827b2ad` is correct but ineffective because the data itself is truncated.

| Issue | Root cause | Fixed by |
|-------|-----------|----------|
| Today not loading | `minTs` range + possible hour format mismatch | Issue #1 fix |
| Yesterday Y-axis capped | Data truncated by `minTs` range | Issue #1 fix |
| 7d/30d/90d stuck at 8k | Data truncated by `minTs` range | Issue #1 fix |
| 30d doesn't show 30 days | `minTs` range produces <30 day window | Issue #1 fix |
| 1y is just a dot | `minTs` range produces <12 month window | Issue #1 fix |

**One fix, one file (`utils.ts`), one function (`fillMissingPeriods`).**
