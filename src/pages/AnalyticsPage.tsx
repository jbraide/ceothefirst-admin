import RevenueChart from "@/features/analytics/components/RevenueChart";
import SignupsChart from "@/features/analytics/components/SignupsChart";
import TransactionsVolumeChart from "@/features/analytics/components/TransactionsVolumeChart";
import RevenueByCategoryChart from "@/features/analytics/components/RevenueByCategoryChart";
import CategoriesChart from "@/features/analytics/components/CategoriesChart";
import ComparisonCards from "@/features/analytics/components/ComparisonCards";
import TopBusinessesTable from "@/features/analytics/components/TopBusinessesTable";
import FeatureAdoptionCards from "@/features/analytics/components/FeatureAdoptionCards";

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Platform-wide metrics, trends, and insights.
        </p>
      </div>

      <div className="space-y-6">
        {/* Top row: Revenue + Signups — side by side */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueChart />
          <SignupsChart />
        </section>

        {/* Second row: Transactions Volume — full width */}
        <section>
          <TransactionsVolumeChart />
        </section>

        {/* Third row: Revenue by Category + Industry Distribution — side by side */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueByCategoryChart />
          <CategoriesChart />
        </section>

        {/* Fourth row: Comparison Cards — full width */}
        <section>
          <ComparisonCards />
        </section>

        {/* Bottom row: Top Businesses + Feature Adoption — side by side */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopBusinessesTable />
          <FeatureAdoptionCards />
        </section>
      </div>
    </div>
  );
}
