import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getRevenueGrowth } from "../api/getRevenueGrowth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { fillMissingPeriods, naira, formatAxisDate } from "../utils";
import RangeSelector from "./RangeSelector";
import type { AnalyticsRange } from "@/types/api";

// ─── Custom Tooltip ────────────────────────────────────────────────────

function RevenueTooltip({
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
        {naira.format(payload[0].value)}
      </p>
    </div>
  );
}

// ─── Revenue Chart ─────────────────────────────────────────────────────

export default function RevenueChart() {
  const [range, setRange] = useState<AnalyticsRange>("30d");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", "revenue-growth", range],
    queryFn: () => getRevenueGrowth({ range }),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Growth</CardTitle>
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
          <CardTitle>Revenue Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load revenue data.</p>
        </CardContent>
      </Card>
    );
  }

  const filled = fillMissingPeriods(data, range, "total");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle>Revenue Growth</CardTitle>
        <RangeSelector value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
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
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}K`
                      : String(v)
                }
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip content={<RevenueTooltip range={range} />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
