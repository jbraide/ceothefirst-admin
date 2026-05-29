import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import PlansList from "@/features/subscriptions/components/PlansList";
import PlanFormModal from "@/features/subscriptions/components/PlanFormModal";
import PlanFeaturesPanel from "@/features/subscriptions/components/PlanFeaturesPanel";
import SubscribedBusinessesList from "@/features/subscriptions/components/SubscribedBusinessesList";
import {
  getFeatures,
  featureKeys,
} from "@/features/subscriptions/api/getFeatures";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import type { Plan, FeatureFlag } from "@/types/api";

type Tab = "plans" | "features" | "businesses";

const CATEGORY_ORDER = [
  "core",
  "retail",
  "growth",
  "freelancer",
  "shortlet",
  "premium",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  retail: "Retail",
  growth: "Growth",
  freelancer: "Freelancer",
  shortlet: "Shortlet",
  premium: "Premium",
};

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<Tab>("plans");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>(undefined);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const {
    data: features,
    isLoading: featuresLoading,
    isError: featuresError,
  } = useQuery({
    queryKey: featureKeys.all,
    queryFn: getFeatures,
    enabled: tab === "features",
  });

  const handleCreate = () => {
    setEditingPlan(undefined);
    setFormOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingPlan(undefined);
  };

  const handleViewFeatures = (planId: string) => {
    setSelectedPlanId(planId === selectedPlanId ? null : planId);
  };

  // ── Group features by category ──
  const groupedFeatures = () => {
    if (!features) return new Map<string, FeatureFlag[]>();
    const grouped = new Map<string, FeatureFlag[]>();
    for (const f of features) {
      if (!grouped.has(f.category)) grouped.set(f.category, []);
      grouped.get(f.category)!.push(f);
    }
    return grouped;
  };

  const sortedCategories = () => {
    const grouped = groupedFeatures();
    const sorted: string[] = CATEGORY_ORDER.filter((cat) => grouped.has(cat));
    for (const cat of grouped.keys()) {
      if (!sorted.includes(cat)) sorted.push(cat);
    }
    return sorted;
  };

  const tabClasses = (active: boolean) =>
    `px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
      active
        ? "bg-indigo-600 text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div>
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Subscriptions & Plans
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage subscription plans and feature flags.
          </p>
        </div>

        {tab === "plans" && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Create Plan
          </Button>
        )}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────── */}
      <div className="mb-6 flex gap-2 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          className={tabClasses(tab === "plans")}
          onClick={() => setTab("plans")}
        >
          Plans
        </button>
        <button
          className={tabClasses(tab === "features")}
          onClick={() => setTab("features")}
        >
          Feature Flags
        </button>
        <button
          className={tabClasses(tab === "businesses")}
          onClick={() => setTab("businesses")}
        >
          Businesses
        </button>
      </div>

      {/* ─── Plans Tab ─────────────────────────────────────── */}
      {tab === "plans" && (
        <div className="space-y-6">
          <PlansList onEdit={handleEdit} onViewFeatures={handleViewFeatures} />

          {selectedPlanId && <PlanFeaturesPanel planId={selectedPlanId} />}
        </div>
      )}

      {/* ─── Features Tab ──────────────────────────────────── */}
      {tab === "features" && (
        <FeaturesGrid
          loading={featuresLoading}
          error={featuresError}
          categories={sortedCategories()}
          grouped={groupedFeatures()}
          labels={CATEGORY_LABELS}
        />
      )}

      {/* ─── Businesses Tab ─────────────────────────────────── */}
      {tab === "businesses" && <SubscribedBusinessesList />}

      {/* ─── Plan Form Modal ───────────────────────────────── */}
      <PlanFormModal
        open={formOpen}
        onClose={handleCloseForm}
        plan={editingPlan}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Features Grid (read-only)                                         */
/* ------------------------------------------------------------------ */

function FeaturesGrid({
  loading,
  error,
  categories,
  grouped,
  labels,
}: {
  loading: boolean;
  error: boolean;
  categories: string[];
  grouped: Map<string, FeatureFlag[]>;
  labels: Record<string, string>;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Spinner size={32} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-red-600">Failed to load feature flags.</p>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-gray-500">No feature flags found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const features = grouped.get(category)!;
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base">
                {labels[category] ?? category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((f) => (
                  <div
                    key={f.id}
                    className="flex flex-col gap-1 rounded-lg border border-gray-200 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {f.name}
                    </span>
                    <span className="text-xs text-gray-500">{f.key}</span>
                    {f.description && (
                      <span className="text-xs text-gray-400">
                        {f.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
