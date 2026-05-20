import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getTransactionsVolume } from "../api/getTransactionsVolume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { fillMissingPeriods, naira, formatAxisDate } from "../utils";
import RangeSelector from "./RangeSelector";
import type { AnalyticsRange } from "@/types/api";

// Custom Tooltip

function VolumeTooltip({
  active,
  payload,
  label,
  range,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: string;
  range: AnalyticsRange;
}) {
  if (!active || !payload?.length || !label) return null;

  const countItem = payload.find((p) => p.name === "count");
  const totalItem = payload.find((p) => p.name === "total");

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-gray-500">{formatAxisDate(label, range)}</p>
      {countItem !== undefined && (
        <p className="text-sm font-semibold text-blue-600">
          {countItem.value} transactions
        </p>
      )}
      {totalItem !== undefined && (
        <p className="text-sm font-semibold text-emerald-600">
          {naira.format(totalItem.value)}
        </p>
      )}
    </div>
  );
}

// Transactions Volume Chart

export default function TransactionsVolumeChart() {
  const [range, setRange] = useState<AnalyticsRange>("30d");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", "transactions-volume", range],
    queryFn: () => getTransactionsVolume({ range }),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions Volume</CardTitle>
          <RangeSelector value={range} onChange={setRange} />
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions Volume</CardTitle>
          <RangeSelector value={range} onChange={setRange} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Failed to load transactions volume data.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions Volume</CardTitle>
          <RangeSelector value={range} onChange={setRange} />
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-gray-500">
            No transaction data available for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Fill both keys independently so total values aren't lost
  const countData = fillMissingPeriods(data, range, "count");
  const totalData = fillMissingPeriods(data, range, "total");
  const filled = countData.map((p, i) => ({
    ...p,
    total: totalData[i]?.total ?? 0,
  }));

  const countMax = filled.reduce((max, d) => Math.max(max, d.count ?? 0), 0);
  const totalMax = filled.reduce((max, d) => Math.max(max, d.total ?? 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle>Transactions Volume</CardTitle>
        <RangeSelector value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
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
                yAxisId="left"
                type="number"
                domain={[0, countMax || 1]}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#3b82f6" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                type="number"
                domain={[0, totalMax || 1]}
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}K`
                      : String(v)
                }
                tick={{ fontSize: 12, fill: "#10b981" }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip content={<VolumeTooltip range={range} />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="count"
                name="count"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="total"
                name="total"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#10b981" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
