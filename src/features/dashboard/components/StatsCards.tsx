import { useQuery } from "@tanstack/react-query";
import { Building2, ArrowLeftRight, Banknote, Users } from "lucide-react";
import { getOverview } from "../api/getOverview";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

// ─── Currency Formatter ────────────────────────────────────────────────

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// ─── Stat Card Config ──────────────────────────────────────────────────

interface StatConfig {
  key: keyof StatValues;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format: (v: number) => string;
  color: string;
}

type StatValues = {
  totalBusinesses: number;
  totalTransactions: number;
  totalRevenue: number;
  activeStaff: number;
};

const statConfigs: StatConfig[] = [
  {
    key: "totalBusinesses",
    label: "Total Businesses",
    icon: Building2,
    format: (v) => v.toLocaleString(),
    color: "text-blue-600 bg-blue-100",
  },
  {
    key: "totalTransactions",
    label: "Total Transactions",
    icon: ArrowLeftRight,
    format: (v) => v.toLocaleString(),
    color: "text-emerald-600 bg-emerald-100",
  },
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: Banknote,
    format: (v) => naira.format(v),
    color: "text-violet-600 bg-violet-100",
  },
  {
    key: "activeStaff",
    label: "Active Staff",
    icon: Users,
    format: (v) => v.toLocaleString(),
    color: "text-amber-600 bg-amber-100",
  },
];

// ─── Skeleton ──────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-7 w-28 animate-pulse rounded bg-gray-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Error State ───────────────────────────────────────────────────────

function StatCardError() {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6">
        <p className="text-sm text-red-600">
          Failed to load stats. Please try again.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Single Stat Card ──────────────────────────────────────────────────

function StatCard({ config, value }: { config: StatConfig; value: number }) {
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn("rounded-lg p-2.5", config.color)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{config.label}</p>
            <p className="text-2xl font-bold tracking-tight">
              {config.format(value)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stats Cards Grid ──────────────────────────────────────────────────

export default function StatsCards() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-overview"],
    queryFn: getOverview,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  if (isError) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfigs.map((cfg) => (
          <StatCardError key={cfg.key} />
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfigs.map((cfg) => (
          <StatCardSkeleton key={cfg.key} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statConfigs.map((cfg) => (
        <StatCard key={cfg.key} config={cfg} value={data![cfg.key]} />
      ))}
    </div>
  );
}
