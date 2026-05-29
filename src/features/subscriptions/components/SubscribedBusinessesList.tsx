import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  getSubscriptionBusinesses,
  subscribedBusinessKeys,
} from "../api/getSubscriptionBusinesses";
import { getPlans, planKeys } from "../api/getPlans";
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
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";

const ITEMS_PER_PAGE = 20;

export default function SubscribedBusinessesList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");

  // ── Fetch plans for the filter dropdown ──
  const { data: plans } = useQuery({
    queryKey: planKeys.lists(),
    queryFn: getPlans,
  });

  // ── Fetch subscribed businesses ──
  const params = {
    page,
    limit: ITEMS_PER_PAGE,
    ...(planFilter && { plan: planFilter }),
    ...(activeFilter && { isActive: activeFilter === "active" }),
  };

  const {
    data: businessesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: subscribedBusinessKeys.lists(params),
    queryFn: () => getSubscriptionBusinesses(params),
  });

  // ── Derived data ──
  const businesses = businessesData?.results ?? [];
  const totalPages = businessesData?.meta?.totalPages ?? 1;

  // ── Plan expiry helpers ──
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const renderPlanExpiry = (planExpiresAt: string | null) => {
    if (!planExpiresAt) return <span className="text-gray-400">—</span>;

    const expired = isExpired(planExpiresAt);

    return (
      <div className="flex flex-col gap-0.5">
        <Badge
          variant={expired ? "destructive" : "success"}
          size="sm"
        >
          {expired ? "Expired" : "Active"}
        </Badge>
        <span className="text-xs text-gray-500">{formatDate(planExpiresAt)}</span>
      </div>
    );
  };

  const renderStatus = (isActive: boolean) => (
    <Badge variant={isActive ? "success" : "secondary"} size="sm">
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );

  // ── Plan select options ──
  const planOptions = [
    { value: "", label: "All Plans" },
    ...(plans ?? []).map((p) => ({
      value: p.name,
      label: p.label,
    })),
  ];

  const activeOptions = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

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
  if (isError || !businessesData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-red-600">
            Failed to load subscribed businesses. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Empty state ──
  if (businesses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-gray-500">No subscribed businesses found.</p>
          <p className="text-xs text-gray-400">
            {planFilter || activeFilter
              ? "Try adjusting your filters."
              : "Businesses with active subscriptions will appear here."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filters ── */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <Select
            label="Plan"
            options={planOptions}
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            label="Status"
            options={activeOptions}
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {(planFilter || activeFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPlanFilter("");
              setActiveFilter("");
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* ── Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            Subscribed Businesses
            {businessesData.meta && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({businessesData.meta.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Business Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Plan</TableHead>
                <TableHead>Trial Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((biz) => (
                <TableRow
                  key={biz.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/businesses/${biz.id}`)}
                >
                  <TableCell className="font-medium">{biz.name}</TableCell>
                  <TableCell>{biz.ownerPhone}</TableCell>
                  <TableCell>{biz.businessType ?? "—"}</TableCell>
                  <TableCell>{biz.category ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {biz.plan?.label ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>{renderPlanExpiry(biz.planExpiresAt)}</TableCell>
                  <TableCell>{renderStatus(biz.isActive)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-4"
        />
      )}
    </div>
  );
}
