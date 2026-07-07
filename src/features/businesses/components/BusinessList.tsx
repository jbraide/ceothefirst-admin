import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, AlertTriangle, X, Download } from "lucide-react";

import {
  getBusinesses,
  businessKeys,
  type GetBusinessesParams,
} from "../api/getBusinesses";
import { getBusinessesByPlan } from "@/features/subscriptions/api/getBusinessesByPlan";
import { deleteBusiness } from "../api/deleteBusiness";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import type { BusinessListItem } from "@/types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string ?? "https://api.ceothefirst.com/api/v1";

const KYC_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  VERIFIED: "success",
  PENDING: "warning",
  REJECTED: "destructive",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BusinessList() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const planFilter = new URLSearchParams(location.search).get("plan") || "";

  const queryParams: GetBusinessesParams = {
    page,
    limit: 15,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  };

  // Plan-filtered query
  const {
    data: planData,
    isLoading: planLoading,
    isError: planError,
  } = useQuery({
    queryKey: ["businesses-by-plan", planFilter],
    queryFn: () => getBusinessesByPlan(planFilter),
    enabled: !!planFilter,
    staleTime: 30_000,
  });

  // Normal query (when no plan filter)
  const {
    data: normalData,
    isLoading: normalLoading,
    isError: normalError,
  } = useQuery({
    queryKey: businessKeys.list(queryParams),
    queryFn: () => getBusinesses(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    enabled: !planFilter,
  });

  const clearPlanFilter = () => {
    navigate("/businesses", { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const businesses = planFilter
    ? (planData ?? [])
    : (normalData?.results ?? []);
  const meta = planFilter ? undefined : normalData?.meta;
  const isLoading = planFilter ? planLoading : normalLoading;
  const isError = planFilter ? planError : normalError;

  const allVisibleSelected =
    businesses.length > 0 && businesses.every((b) => selectedIds.has(b.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const b of businesses) next.delete(b.id);
      } else {
        for (const b of businesses) next.add(b.id);
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    setDeleting(true);
    setDeleteError(null);

    let failed = 0;
    for (const id of ids) {
      try {
        await deleteBusiness(id);
      } catch {
        failed++;
      }
    }

    if (failed > 0) {
      setDeleteError(`${failed} of ${ids.length} deletions failed.`);
    }

    setDeleting(false);
    setSelectedIds(new Set());
    setDeleteConfirmOpen(false);
    queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
  }

  function handleExportCSV() {
    const token = useAuthStore.getState().token;
    if (!token) return;
    fetch(`${BASE_URL}/admin/businesses/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "businesses.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch((err) => console.error("Export failed:", err));
  }

  const selectedNames = businesses
    .filter((b) => selectedIds.has(b.id))
    .map((b) => b.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Businesses</h2>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <div className="flex items-center gap-3">
          {someSelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {planFilter && (
        <div className="flex items-center gap-3 rounded-lg border bg-blue-50 px-4 py-3 text-sm">
          <span className="text-blue-800">
            Showing businesses on the{" "}
            <span className="font-semibold">{planFilter}</span> plan
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearPlanFilter}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
            Clear filter
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            All Businesses
            {meta && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({meta.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          )}

          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-medium text-destructive">
                Failed to load businesses
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please check your connection and try again.
              </p>
            </div>
          )}

          {!isLoading && !isError && businesses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No businesses found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {debouncedSearch
                  ? `No results for "${debouncedSearch}". Try a different search term.`
                  : "There are no registered businesses yet."}
              </p>
            </div>
          )}

          {!isLoading && !isError && businesses.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-500"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses.map((biz: BusinessListItem) => (
                      <TableRow
                        key={biz.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(biz.id)}
                            onChange={() => toggleSelect(biz.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-500"
                          />
                        </TableCell>
                        <TableCell
                          className="cursor-pointer font-medium"
                          tabIndex={0}
                          role="link"
                          onClick={() => navigate(`/businesses/${biz.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              navigate(`/businesses/${biz.id}`);
                            }
                          }}
                        >
                          {biz.name}
                        </TableCell>
                        <TableCell>{biz.ownerPhone}</TableCell>
                        <TableCell>{biz.category ?? "—"}</TableCell>
                        <TableCell>{biz.state ?? "—"}</TableCell>
                        <TableCell
                          className="max-w-[140px] truncate"
                          title={biz.owner?.name}
                        >
                          {biz.owner?.name ?? biz.ownerPhone}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={biz.isActive ? "success" : "destructive"}
                          >
                            {biz.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={KYC_VARIANT[biz.verificationStatus]}>
                            {biz.verificationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {biz.plan?.label ? (
                            <Badge variant="outline">{biz.plan.label}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {biz._count.transactions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(biz.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.totalPages}
                  </p>
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Selected Businesses"
        description={`Permanently delete ${selectedIds.size} business(es) and all associated data.`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm">
                This will permanently delete the following businesses and ALL
                their data (transactions, products, staff, contacts, etc.). This
                action cannot be undone.
              </p>
              {selectedNames.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-y-auto rounded border p-2 text-sm">
                  {selectedNames.map((name) => (
                    <li key={name} className="py-0.5">
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              loading={deleting}
            >
              {deleting
                ? "Deleting..."
                : `Yes, Delete ${selectedIds.size} Business${selectedIds.size > 1 ? "es" : ""}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
