import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getPlanDetail } from "../api/getPlanDetail";
import { planKeys } from "../api/getPlans";
import { togglePlanFeature } from "../api/togglePlanFeature";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Toast, type ToastType } from "@/components/ui/Toast";
import { useState } from "react";
import type { PlanFeature } from "@/types/api";

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

export interface PlanFeaturesPanelProps {
  planId: string;
}

export default function PlanFeaturesPanel({ planId }: PlanFeaturesPanelProps) {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const {
    data: plan,
    isLoading,
    isError,
  } = useQuery({
    queryKey: planKeys.detail(planId),
    queryFn: () => getPlanDetail(planId),
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      featureId,
      isEnabled,
    }: {
      featureId: string;
      isEnabled: boolean;
    }) => togglePlanFeature(planId, featureId, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(planId) });
    },
    onError: () => {
      setToast({
        message: "Failed to toggle feature. Please try again.",
        type: "error",
      });
    },
  });

  // ── Loading state ──
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Spinner size={32} />
        </CardContent>
      </Card>
    );
  }

  // ── Error state ──
  if (isError || !plan) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-red-600">Failed to load plan features.</p>
        </CardContent>
      </Card>
    );
  }

  // ── Group features by category ──
  const grouped = new Map<string, PlanFeature[]>();
  for (const pf of plan.features) {
    const cat = pf.feature.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(pf);
  }

  // Sort categories by predefined order
  const sortedCategories: string[] = CATEGORY_ORDER.filter((cat) => grouped.has(cat));
  // Append any unknown categories
  for (const cat of grouped.keys()) {
    if (!sortedCategories.includes(cat)) {
      sortedCategories.push(cat);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Features for {plan.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {sortedCategories.map((category) => {
            const features = grouped.get(category)!;
            return (
              <div key={category}>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {CATEGORY_LABELS[category] ?? category}
                </h4>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {features.map((pf) => (
                    <div
                      key={pf.feature.key}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {pf.feature.name}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={pf.isEnabled}
                        aria-label={`Toggle ${pf.feature.name}`}
                        disabled={toggleMutation.isPending}
                        onClick={() =>
                          toggleMutation.mutate({
                            featureId: pf.feature.key,
                            isEnabled: !pf.isEnabled,
                          })
                        }
                        className={`
                          relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center
                          rounded-full transition-colors duration-200 ease-in-out
                          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${pf.isEnabled ? "bg-indigo-600" : "bg-gray-200"}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white shadow
                            transition-transform duration-200 ease-in-out
                            ${pf.isEnabled ? "translate-x-6" : "translate-x-1"}
                          `}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {plan.features.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">
              No features assigned to this plan.
            </p>
          )}
        </CardContent>
      </Card>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
