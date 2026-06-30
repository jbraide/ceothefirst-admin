import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";

import {
  getFeatureRequests,
  featureRequestKeys,
} from "@/features/feature-requests/api/getFeatureRequests";
import { updateFeatureRequestStatus } from "@/features/feature-requests/api/updateFeatureRequest";
import { getFeatureRequestDetail } from "@/features/feature-requests/api/getFeatureRequestDetail";

import type { FeatureStatus, UpdateFeatureRequestStatus } from "@/types/api";
import { FEATURE_MODULES, FEATURE_STATUSES, MODULE_LABELS } from "@/types/api";

import { Card, CardContent } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 10;

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-800",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  reviewed: "bg-blue-100 text-blue-800",
  planned: "bg-purple-100 text-purple-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  declined: "Declined",
};

const SOURCE_COLORS: Record<string, string> = {
  web: "bg-blue-100 text-blue-800",
  telegram: "bg-sky-100 text-sky-800",
  whatsapp: "bg-emerald-100 text-emerald-800",
};

const SOURCE_LABELS: Record<string, string> = {
  web: "Web",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function priorityBadge(priority: string) {
  return (
    <Badge className={PRIORITY_COLORS[priority] ?? "bg-gray-100 text-gray-800"}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

function statusBadge(status: string) {
  return (
    <Badge className={STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800"}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function sourceBadge(source: string) {
  return (
    <Badge className={SOURCE_COLORS[source] ?? "bg-gray-100 text-gray-800"}>
      {SOURCE_LABELS[source] ?? source}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status update form (rendered inside expanded detail)                       */
/* -------------------------------------------------------------------------- */

interface StatusUpdateFormProps {
  featureId: string;
  currentStatus: FeatureStatus;
  currentAdminNotes: string | null;
  isPending: boolean;
  onSubmit: (body: UpdateFeatureRequestStatus) => void;
}

function StatusUpdateForm({
  featureId: _featureId,
  currentStatus,
  currentAdminNotes,
  isPending,
  onSubmit,
}: StatusUpdateFormProps) {
  const [newStatus, setNewStatus] = useState<FeatureStatus>(currentStatus);
  const [adminNotes, setAdminNotes] = useState(currentAdminNotes ?? "");

  const statusOptions = FEATURE_STATUSES.map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
  }));

  const handleSubmit = () => {
    const body: UpdateFeatureRequestStatus = {};
    if (newStatus !== currentStatus) body.status = newStatus;
    if (adminNotes !== (currentAdminNotes ?? "")) body.adminNotes = adminNotes;
    if (Object.keys(body).length === 0) return;
    onSubmit(body);
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-primary/10 bg-gray-50 p-4">
      <h4 className="text-sm font-semibold text-gray-700">Update Status</h4>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <Select
            label="Status"
            options={statusOptions}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as FeatureStatus)}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`admin-notes-${_featureId}`}
          className="block text-sm font-medium text-primary mb-1.5"
        >
          Admin Notes
        </label>
        <textarea
          id={`admin-notes-${_featureId}`}
          rows={3}
          className="flex w-full rounded-md border border-primary/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1"
          placeholder="Add internal notes about this request..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSubmit}
          loading={isPending}
          disabled={
            newStatus === currentStatus &&
            adminNotes === (currentAdminNotes ?? "")
          }
        >
          Update
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Expanded detail panel                                                      */
/* -------------------------------------------------------------------------- */

interface ExpandedDetailProps {
  featureId: string;
}

function ExpandedDetail({ featureId }: ExpandedDetailProps) {
  const queryClient = useQueryClient();
  const { toast, showToast, clearToast } = useToast();

  const {
    data: detail,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["feature-requests", "detail", featureId],
    queryFn: () => getFeatureRequestDetail(featureId),
    enabled: !!featureId,
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (body: UpdateFeatureRequestStatus) =>
      updateFeatureRequestStatus(featureId, body),
    onSuccess: () => {
      showToast("Feature request updated successfully.", "success");
      queryClient.invalidateQueries({
        queryKey: featureRequestKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: ["feature-requests", "detail", featureId],
      });
    },
    onError: () => {
      showToast("Failed to update feature request.", "error");
    },
  });

  if (isLoading) {
    return (
      <td colSpan={8} className="px-4 py-6">
        <div className="flex justify-center">
          <Spinner size={20} />
        </div>
      </td>
    );
  }

  if (isError || !detail) {
    return (
      <td colSpan={8} className="px-4 py-6">
        <p className="text-center text-sm text-red-600">
          Failed to load request details.
        </p>
      </td>
    );
  }

  return (
    <td colSpan={8} className="px-4 py-4">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}

      <div className="space-y-4">
        {/* Description */}
        {detail.description && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary/50 mb-1">
              Description
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {detail.description}
            </p>
          </div>
        )}

        {/* Admin Notes (current) */}
        {detail.adminNotes && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary/50 mb-1">
              Admin Notes
            </h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {detail.adminNotes}
            </p>
          </div>
        )}

        {/* Last updated */}
        <p className="text-xs text-gray-400">
          Last updated: {formatDate(detail.updatedAt)}
        </p>

        {/* Inline status update form */}
        <StatusUpdateForm
          featureId={featureId}
          currentStatus={detail.status}
          currentAdminNotes={detail.adminNotes}
          isPending={updateMutation.isPending}
          onSubmit={(body) => updateMutation.mutate(body)}
        />
      </div>
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/*  FeatureRequestsList                                                        */
/* -------------------------------------------------------------------------- */

export default function FeatureRequestsList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { toast, clearToast } = useToast();

  /* ---- build query params ---- */
  const queryParams = {
    status: statusFilter || undefined,
    module: moduleFilter || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: featureRequestKeys.list(queryParams),
    queryFn: () => getFeatureRequests(queryParams),
    staleTime: 30_000,
  });

  /* ---- filter change → reset to page 1 ---- */
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    setExpandedId(null);
  };

  const handleModuleChange = (value: string) => {
    setModuleFilter(value);
    setPage(1);
    setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  /* ---- filter option builders ---- */
  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...FEATURE_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  ];

  const moduleOptions = [
    { value: "", label: "All Modules" },
    ...FEATURE_MODULES.map((m) => ({
      value: m,
      label: MODULE_LABELS[m] ?? m,
    })),
  ];

  const results = data?.results ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}

      {/* Filters row */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <Select
                label="Status"
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                label="Module"
                options={moduleOptions}
                value={moduleFilter}
                onChange={(e) => handleModuleChange(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Spinner size={32} />
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-red-600">
                Failed to load feature requests.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {(error as Error)?.message ?? "An unknown error occurred."}
              </p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-gray-500">
                No feature requests found.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}

          {/* Data */}
          {!isLoading && !isError && results.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Title</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <>
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => toggleExpand(item.id)}
                      >
                        <TableCell className="w-8">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-primary/50" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-primary/50" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {item.title}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.business?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" size="sm">
                            {MODULE_LABELS[item.module] ?? item.module}
                          </Badge>
                        </TableCell>
                        <TableCell>{priorityBadge(item.priority)}</TableCell>
                        <TableCell>{statusBadge(item.status)}</TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {item.voteCount}
                        </TableCell>
                        <TableCell>{sourceBadge(item.source)}</TableCell>
                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </TableCell>
                      </TableRow>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <TableRow>
                          <ExpandedDetail featureId={item.id} />
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {results.length} of {meta.total} request
            {meta.total !== 1 ? "s" : ""}
          </p>
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(p) => {
              setPage(p);
              setExpandedId(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
