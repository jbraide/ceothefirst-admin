import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Settings, Users } from "lucide-react";

import { getPlans, planKeys } from "../api/getPlans";
import { deletePlan } from "../api/deletePlan";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";
import { Toast, type ToastType } from "@/components/ui/Toast";
import type { Plan } from "@/types/api";

const ITEMS_PER_PAGE = 10;

export interface PlansListProps {
  onEdit: (plan: Plan) => void;
  onViewFeatures: (planId: string) => void;
}

export default function PlansList({ onEdit, onViewFeatures }: PlansListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const {
    data: plans,
    isLoading,
    isError,
  } = useQuery({
    queryKey: planKeys.lists(),
    queryFn: getPlans,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      setToast({ message: "Plan deleted successfully.", type: "success" });
    },
    onError: () => {
      setToast({ message: "Failed to delete plan.", type: "error" });
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
  if (isError || !plans) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-red-600">
            Failed to load plans. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Empty state ──
  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-gray-500">No plans found.</p>
          <p className="text-xs text-gray-400">
            Create a new plan to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Pagination ──
  const totalPages = Math.ceil(plans.length / ITEMS_PER_PAGE);
  const paginatedPlans = plans.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const formatNaira = (price: string) => {
    const num = parseFloat(price);
    return isNaN(num)
      ? price
      : `₦${num.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
  };

  const planLimit = (val: number | undefined): string => {
    const v = val ?? 0;
    return v === -1 ? "Unlimited" : v.toLocaleString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Plans</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Max Transactions</TableHead>
                <TableHead>Max Products</TableHead>
                <TableHead>Max Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.label}</TableCell>
                  <TableCell>{formatNaira(plan.price)}</TableCell>
                  <TableCell>{planLimit(plan.maxTransactions)}</TableCell>
                  <TableCell>{planLimit(plan.maxProducts)}</TableCell>
                  <TableCell>{planLimit(plan.maxStaff)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Active
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(plan)}
                        aria-label={`Edit ${plan.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewFeatures(plan.id)}
                        aria-label={`Features for ${plan.name}`}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(`/businesses?plan=${plan.name}`)
                        }
                        aria-label={`View businesses on ${plan.name}`}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(plan.id)}
                        loading={deleteMutation.isPending}
                        aria-label={`Delete ${plan.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-4"
        />
      )}

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
