import { useQuery } from "@tanstack/react-query";
import { FileText, Users, CreditCard } from "lucide-react";
import { getFeatureAdoption } from "../api/getFeatureAdoption";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";

// ─── Progress Bar ──────────────────────────────────────────────────────

function ProgressBar({ value, color }: { value: number; color: string }) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ─── Adoption Card ─────────────────────────────────────────────────────

interface AdoptionCardProps {
  label: string;
  count: number;
  total: number;
  percent: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  barColor: string;
}

function AdoptionCard({
  label,
  count,
  total,
  percent,
  icon: Icon,
  color,
  barColor,
}: AdoptionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className={cn("rounded-lg p-2", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold">{percent.toFixed(1)}%</span>
          <span className="text-sm text-gray-500">
            {count.toLocaleString()} / {total.toLocaleString()}
          </span>
        </div>
        <ProgressBar value={percent} color={barColor} />
      </CardContent>
    </Card>
  );
}

// ─── Feature Adoption Cards ────────────────────────────────────────────

export default function FeatureAdoptionCards() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["feature-adoption"],
    queryFn: getFeatureAdoption,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-sm text-red-600">
            Failed to load feature adoption data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const cards: AdoptionCardProps[] = [
    {
      label: "Invoices",
      count: data.usingInvoices,
      total: data.totalBusinesses,
      percent: data.percentUsingInvoices,
      icon: FileText,
      color: "text-blue-600 bg-blue-100",
      barColor: "bg-blue-500",
    },
    {
      label: "Staff",
      count: data.usingStaff,
      total: data.totalBusinesses,
      percent: data.percentUsingStaff,
      icon: Users,
      color: "text-emerald-600 bg-emerald-100",
      barColor: "bg-emerald-500",
    },
    {
      label: "Debts",
      count: data.usingDebts,
      total: data.totalBusinesses,
      percent: data.percentUsingDebts,
      icon: CreditCard,
      color: "text-violet-600 bg-violet-100",
      barColor: "bg-violet-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <AdoptionCard key={card.label} {...card} />
      ))}
    </div>
  );
}
