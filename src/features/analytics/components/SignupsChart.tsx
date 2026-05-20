import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getSignups } from "../api/getSignups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { fillMissingPeriods, formatAxisDate } from "../utils";
import RangeSelector from "./RangeSelector";
import type { AnalyticsRange } from "@/types/api";

// ─── Custom Tooltip ────────────────────────────────────────────────────

function SignupsTooltip({
  active,
  payload,
  label,
  range,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  range: AnalyticsRange;
}) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-500">{formatAxisDate(label, range)}</p>
      <p className="text-sm font-semibold text-gray-900">
        {payload[0].value} signup{payload[0].value === 1 ? "" : "s"}
      </p>
    </div>
  );
}

// ─── Signups Chart ─────────────────────────────────────────────────────

export default function SignupsChart() {
  const [range, setRange] = useState<AnalyticsRange>("30d");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", "signups", range],
    queryFn: () => getSignups({ range }),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Signups</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner size={32} />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle>Daily Signups</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load signup data.</p>
        </CardContent>
      </Card>
    );
  }

  const filled = fillMissingPeriods(data, range, "count");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle>Daily Signups</CardTitle>
        <RangeSelector value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filled}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => formatAxisDate(v, range)}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                interval="preserveStartEnd"
              />
              <YAxis
                type="number"
                domain={[0, "auto"]}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<SignupsTooltip range={range} />} />
              <Bar
                dataKey="count"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
