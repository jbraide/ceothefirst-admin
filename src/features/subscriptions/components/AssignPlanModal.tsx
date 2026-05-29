import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getPlans, planKeys } from "../api/getPlans";
import { assignPlan } from "../api/assignPlan";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Toast, type ToastType } from "@/components/ui/Toast";
import type { AssignPlanResponse } from "@/types/api";

export interface AssignPlanModalProps {
  open: boolean;
  onClose: () => void;
  businessId?: string;
  businessName?: string;
}

export default function AssignPlanModal({
  open,
  onClose,
  businessId,
  businessName,
}: AssignPlanModalProps) {
  const queryClient = useQueryClient();

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [result, setResult] = useState<AssignPlanResponse | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const {
    data: plans,
    isLoading: plansLoading,
  } = useQuery({
    queryKey: planKeys.lists(),
    queryFn: getPlans,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (planId: string) =>
      assignPlan(businessId!, { planId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      setResult(data);
      setToast({
        message: data.message ?? "Plan assigned successfully.",
        type: "success",
      });
    },
    onError: () => {
      setToast({
        message: "Failed to assign plan. Please try again.",
        type: "error",
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !businessId) return;
    mutation.mutate(selectedPlanId);
  };

  const handleClose = () => {
    setSelectedPlanId("");
    setResult(null);
    setToast(null);
    onClose();
  };

  const planOptions = (plans ?? []).map((p) => ({
    value: p.id,
    label: `${p.label} (${p.name}) - ₦${p.price}`,
  }));

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="Assign Plan"
        description={
          businessName
            ? `Assign a subscription plan to ${businessName}.`
            : "Assign a subscription plan to the selected business."
        }
      >
        {result ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-6 w-6 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {result.message}
            </p>
            <p className="text-xs text-gray-500">
              Plan <span className="font-medium">{result.plan}</span> has been
              assigned to{" "}
              <span className="font-medium">{result.businessName}</span>.
            </p>
            <Button
              variant="outline"
              onClick={handleClose}
              className="mt-2"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {plansLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size={24} />
              </div>
            ) : (
              <Select
                label="Select Plan"
                placeholder="Choose a plan..."
                options={planOptions}
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                required
              />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={mutation.isPending}
                disabled={!selectedPlanId || plansLoading}
              >
                Assign Plan
              </Button>
            </div>
          </form>
        )}
      </Modal>

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
