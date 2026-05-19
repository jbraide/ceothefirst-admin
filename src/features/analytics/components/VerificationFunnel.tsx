import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { VerificationFunnelItem } from "@/types/api";
import { getVerificationFunnel } from "../api/getVerificationFunnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { CHART_COLORS } from "../utils";

// ─── Status Labels & Colors ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  VerificationFunnelItem["verificationStatus"],
  { label: string; color: string }
> = {
  PENDING: { label: "Pending", color: CHART_COLORS[3] }, // amber
  VERIFIED: { label: "Verified", color: CHART_COLORS[1] }, // emerald
  REJECTED: { label: "Rejected", color: CHART_COLORS[4] }, // red
};

type FunnelDatum = {
  status: VerificationFunnelItem["verificationStatus"];
  label: string;
  count: number;
  fill: string;
};

// ─── Custom Tooltip ────────────────────────────────────────────────────

function FunnelTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: FunnelDatum }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-gray-900">{d.label}</p>
      <p className="text-xs text-gray-500">
        {d.count.toLocaleString()} business{d.count === 1 ? "" : "es"}
      </p>
    </div>
  );
}

// ─── Verification Funnel ───────────────────────────────────────────────

export default function VerificationFunnel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["verification-funnel"],
    queryFn: getVerificationFunnel,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Funnel</CardTitle>
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
          <CardTitle>Verification Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Failed to load verification funnel data.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Default to 0 for any missing statuses
  const statusCounts: Record<
    VerificationFunnelItem["verificationStatus"],
    number
  > = {
    PENDING: 0,
    VERIFIED: 0,
    REJECTED: 0,
  };

  for (const item of data) {
    statusCounts[item.verificationStatus] = item.count;
  }

  // Build chart data in funnel order
  const chartData: FunnelDatum[] = (
    ["PENDING", "VERIFIED", "REJECTED"] as const
  ).map((status) => ({
    status,
    label: STATUS_CONFIG[status].label,
    count: statusCounts[status],
    fill: STATUS_CONFIG[status].color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 12, fill: "#334155" }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip content={<FunnelTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={40}>
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
