import { useQuery } from "@tanstack/react-query";
import type { Payload } from "recharts/types/component/DefaultLegendContent";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getCategories } from "../api/getCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { CHART_COLORS } from "../utils";

// ─── Pie Chart Datum ───────────────────────────────────────────────────

interface PieDatum {
  name: string;
  value: number;
  fill: string;
}

// ─── Custom Tooltip ────────────────────────────────────────────────────

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: PieDatum }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-gray-900">{d.name}</p>
      <p className="text-xs text-gray-500">
        {d.value.toLocaleString()} business{d.value === 1 ? "" : "es"}
      </p>
    </div>
  );
}

// ─── Custom Legend ─────────────────────────────────────────────────────

function renderLegend(props: { payload?: Payload[] }) {
  const { payload } = props;
  if (!payload) return null;

  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
      {payload.map((entry) => {
        const datum = entry.payload as unknown as PieDatum | undefined;
        return (
          <li
            key={datum?.name ?? String(entry.value)}
            className="flex items-center gap-1.5"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: datum?.fill ?? entry.color }}
            />
            <span className="text-gray-600">
              {datum?.name ?? String(entry.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Categories Pie Chart ──────────────────────────────────────────────

export default function CategoriesChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Industry Distribution</CardTitle>
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
          <CardTitle>Industry Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load category data.</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Industry Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-gray-500">
            No category data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Map to pie data, replacing null categories with "Uncategorized"
  const pieData: PieDatum[] = data.map((item, idx) => ({
    name: item.category ?? "Uncategorized",
    value: item.count,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Industry Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CategoryTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
