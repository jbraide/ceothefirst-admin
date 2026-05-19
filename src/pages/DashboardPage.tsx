import { useQuery } from "@tanstack/react-query";

import StatsCards from "@/features/dashboard/components/StatsCards";
import RevenueChart from "@/features/analytics/components/RevenueChart";
import SignupsChart from "@/features/analytics/components/SignupsChart";
import VerificationFunnel from "@/features/analytics/components/VerificationFunnel";
import FeatureAdoptionCards from "@/features/analytics/components/FeatureAdoptionCards";
import TopBusinessesTable from "@/features/analytics/components/TopBusinessesTable";
import CategoriesChart from "@/features/analytics/components/CategoriesChart";

import { getActiveBusinesses } from "@/features/analytics/api/getActiveBusinesses";
import { getAverageVolume } from "@/features/analytics/api/getAverageVolume";
import { getPlatformDebt } from "@/features/analytics/api/getPlatformDebt";

import { Card, CardContent } from "@/components/ui/Card";
import { naira } from "@/features/analytics/utils";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats row — full width */}
      <section>
        <StatsCards />
      </section>

      {/* Revenue & Signups — side by side */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart />
        <SignupsChart />
      </section>

      {/* Funnel & Feature Adoption — side by side */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VerificationFunnel />
        <FeatureAdoptionCards />
      </section>

      {/* Bottom row: DAU/MAU, Average Volume, Platform Debt */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ActiveBusinessesSummary />
        <AverageVolumeCard />
        <PlatformDebtSummary />
      </section>

      {/* Tables & Charts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopBusinessesTable />
        <CategoriesChart />
      </section>
    </div>
  );
}

/* ─── Active Businesses (DAU / MAU) ────────────────────────────────── */

function ActiveBusinessesSummary() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", "active-businesses", "30d"],
    queryFn: () => getActiveBusinesses(),
    staleTime: 60_000,
  });

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <p className="text-sm text-red-600">Failed to load.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-gray-500">Active Businesses</h3>
        {isLoading ? (
          <div className="mt-4 space-y-3">
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        ) : (
          <div className="mt-4 flex items-baseline gap-6">
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.dau?.toLocaleString() ?? 0}
              </p>
              <p className="text-xs text-gray-500">DAU (24h)</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.mau?.toLocaleString() ?? 0}
              </p>
              <p className="text-xs text-gray-500">MAU (30d)</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Average Volume (ARPU) ───────────────────────────────────────── */

function AverageVolumeCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", "average-volume", "30d"],
    queryFn: () => getAverageVolume(),
    staleTime: 60_000,
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-gray-500">
          Avg. Volume (ARPU)
        </h3>
        {isLoading ? (
          <div className="mt-4 space-y-3">
            <div className="h-7 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        ) : isError ? (
          <p className="mt-4 text-sm text-red-600">Failed to load.</p>
        ) : (
          <>
            <p className="mt-4 text-2xl font-semibold text-gray-900">
              {naira.format(data?.arpu ?? 0)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Across {data?.totalBusinesses?.toLocaleString() ?? 0} active
              businesses
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Platform Debt ───────────────────────────────────────────────── */

function PlatformDebtSummary() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", "platform-debt", "30d"],
    queryFn: () => getPlatformDebt(),
    staleTime: 60_000,
  });

  const receivable =
    data?.find((d) => d.type === "receivable")?.totalOutstanding ?? 0;
  const payable =
    data?.find((d) => d.type === "payable")?.totalOutstanding ?? 0;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-gray-500">Platform Debt</h3>
        {isLoading ? (
          <div className="mt-4 space-y-3">
            <div className="h-7 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        ) : isError ? (
          <p className="mt-4 text-sm text-red-600">Failed to load.</p>
        ) : (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Receivable</span>
              <span className="font-semibold text-green-700">
                {naira.format(receivable)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Payable</span>
              <span className="font-semibold text-red-700">
                {naira.format(payable)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
