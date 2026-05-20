import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getComparison } from "../api/getComparison";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { naira, formatAxisDate } from "../utils";
import RangeSelector from "./RangeSelector";
import type { AnalyticsRange } from "@/types/api";

function DeltaBadge({
  delta,
  deltaPercent,
}: {
  delta: number;
  deltaPercent: number | null;
}) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  if (deltaPercent === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Minus size={14} />
        N/A
      </span>
    );
  }

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        No change
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {isPositive ? "+" : ""}
      {deltaPercent.toFixed(1)}%
    </span>
  );
}

export default function ComparisonCards() {
  const [range, setRange] = useState<AnalyticsRange>("7d");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", "comparison", range],
    queryFn: () => getComparison({ range }),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle>Period Comparison</CardTitle>
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
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle>Period Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Failed to load comparison data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { period, previous: prevPeriod, metrics: m } = data;

  const cards = [
    {
      title: "Revenue",
      currentValue: naira.format(m.revenue.current),
      previousValue: naira.format(m.revenue.previous),
      delta: m.revenue.delta,
      deltaPercent: m.revenue.deltaPercent,
    },
    {
      title: "Transactions",
      currentValue: m.transactions.current.toLocaleString(),
      previousValue: m.transactions.previous.toLocaleString(),
      delta: m.transactions.delta,
      deltaPercent: m.transactions.deltaPercent,
    },
    {
      title: "New Businesses",
      currentValue: m.signups.current.toLocaleString(),
      previousValue: m.signups.previous.toLocaleString(),
      delta: m.signups.delta,
      deltaPercent: m.signups.deltaPercent,
    },
    {
      title: "Active Businesses",
      currentValue: m.activeBusinesses.current.toLocaleString(),
      previousValue: m.activeBusinesses.previous.toLocaleString(),
      delta: m.activeBusinesses.delta,
      deltaPercent: m.activeBusinesses.deltaPercent,
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Period Comparison</CardTitle>
          <p className="mt-1 text-xs text-gray-500">
            {formatAxisDate(period.start, range)} –{" "}
            {formatAxisDate(period.end, range)} vs{" "}
            {formatAxisDate(prevPeriod.start, range)} –{" "}
            {formatAxisDate(prevPeriod.end, range)}
          </p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-gray-100 bg-gray-50/50 p-4"
            >
              <p className="text-xs font-medium text-gray-500">{card.title}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {card.currentValue}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <DeltaBadge
                  delta={card.delta}
                  deltaPercent={card.deltaPercent}
                />
                <span className="text-xs text-gray-400">
                  vs {card.previousValue}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
