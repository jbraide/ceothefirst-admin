import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Store,
  Banknote,
  Package,
  Users,
  Contact,
  CreditCard,
  ShieldCheck,
  FileText,
  ExternalLink,
  AlertTriangle,
  Trash2,
} from "lucide-react";

import { getBusinessDetail } from "../api/getBusinessDetail";
import { updateBusinessStatus } from "../api/updateBusinessStatus";
import { deleteBusiness } from "../api/deleteBusiness";
import { businessKeys } from "../api/getBusinesses";
import { getBusinessPlan } from "@/features/subscriptions/api/getBusinessPlan";
import AssignPlanModal from "@/features/subscriptions/components/AssignPlanModal";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import type { RecentTransaction } from "@/types/api";

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
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: string): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BusinessDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const {
    data: business,
    isLoading,
    isError,
  } = useQuery({
    queryKey: businessKeys.detail(id!),
    queryFn: () => getBusinessDetail(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: currentPlan, isLoading: planLoading } = useQuery({
    queryKey: ["business-plan", id],
    queryFn: () => getBusinessPlan(id!),
    enabled: !!id,
    staleTime: 60_000,
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      updateBusinessStatus(id!, {
        isActive: !business?.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(id!) });
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      setConfirmOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBusiness(id!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      console.log("Business deleted:", result.businessName);
      navigate("/businesses");
    },
    onError: (err) => {
      console.error("Failed to delete business:", err);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (isError || !business) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Failed to load business</h2>
        <p className="mt-1 text-muted-foreground">
          The business could not be found or an error occurred.
        </p>
        <Button className="mt-6" onClick={() => navigate("/businesses")}>
          Back to Businesses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Back Button & Header ─── */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/businesses")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {business.name}
            </h1>
            <Badge variant={business.isActive ? "success" : "destructive"}>
              {business.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={KYC_VARIANT[business.verificationStatus]}>
              {business.verificationStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">ID: {business.id}</p>
        </div>
        <Button
          variant={business.isActive ? "destructive" : "default"}
          onClick={() => setConfirmOpen(true)}
          disabled={statusMutation.isPending}
        >
          {statusMutation.isPending
            ? "Processing..."
            : business.isActive
              ? "Suspend Business"
              : "Activate Business"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            "Deleting..."
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Business
            </>
          )}
        </Button>
      </div>

      {/* ─── Count Cards ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Transactions"
          value={business._count.transactions}
        />
        <StatCard
          icon={Package}
          label="Products"
          value={business._count.products}
        />
        <StatCard icon={Users} label="Staff" value={business._count.staff} />
        <StatCard
          icon={Contact}
          label="Contacts"
          value={business._count.contacts}
        />
      </div>

      {/* ─── Business Information ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={Store}
              label="Business Type"
              value={business.businessType}
            />
            <InfoRow icon={Tag} label="Category" value={business.category} />
            <InfoRow icon={Phone} label="Phone" value={business.ownerPhone} />
            <InfoRow icon={Mail} label="Email" value={business.email} />
            <InfoRow icon={MapPin} label="State" value={business.state} />
            <InfoRow icon={MapPin} label="City" value={business.city} />
            <InfoRow
              icon={Calendar}
              label="Registered"
              value={formatDate(business.createdAt)}
            />
          </CardContent>
        </Card>

        {/* Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {business.bankName ||
            business.accountNumber ||
            business.accountName ? (
              <>
                <InfoRow
                  icon={Building2}
                  label="Bank"
                  value={business.bankName}
                />
                <InfoRow
                  icon={FileText}
                  label="Account Number"
                  value={business.accountNumber}
                />
                <InfoRow
                  icon={FileText}
                  label="Account Name"
                  value={business.accountName}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No bank information provided.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Subscription Plan ─── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Plan
          </CardTitle>
          <Button size="sm" onClick={() => setPlanModalOpen(true)}>
            Assign Plan
          </Button>
        </CardHeader>
        <CardContent>
          {planLoading ? (
            <div className="flex items-center gap-3 py-2">
              <Spinner size={20} />
              <span className="text-sm text-muted-foreground">
                Loading plan...
              </span>
            </div>
          ) : currentPlan ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Plan
                </p>
                <p className="font-semibold">
                  {currentPlan.label} ({currentPlan.name})
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Price
                </p>
                <p className="font-semibold">
                  ₦{Number(currentPlan.price).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Max Transactions
                </p>
                <p className="font-semibold">
                  {currentPlan.maxTransactions === -1
                    ? "Unlimited"
                    : currentPlan.maxTransactions.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Max Products
                </p>
                <p className="font-semibold">
                  {currentPlan.maxProducts === -1
                    ? "Unlimited"
                    : currentPlan.maxProducts.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Max Staff
                </p>
                <p className="font-semibold">
                  {currentPlan.maxStaff === -1
                    ? "Unlimited"
                    : currentPlan.maxStaff.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Max Contacts
                </p>
                <p className="font-semibold">
                  {currentPlan.maxContacts === -1
                    ? "Unlimited"
                    : currentPlan.maxContacts.toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No plan assigned.</p>
          )}
        </CardContent>
      </Card>

      {/* ─── Verification Documents ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Verification Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {business.verificationDocs.length > 0 ? (
            <ul className="space-y-2">
              {business.verificationDocs.map((docUrl, idx) => (
                <li key={idx}>
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Document {idx + 1}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No verification documents uploaded.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ─── Recent Transactions ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {business.recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {business.recentTransactions.map((txn: RecentTransaction) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <Badge variant="outline">{txn.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {txn.description || "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(txn.amount)}
                      </TableCell>
                      <TableCell>{formatCurrency(txn.amountPaid)}</TableCell>
                      <TableCell>{txn.paymentMethod}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(txn.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No transactions yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Confirmation Modal ─── */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                business.isActive ? "bg-destructive/10" : "bg-primary/10",
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  business.isActive ? "text-destructive" : "text-primary",
                )}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {business.isActive ? "Suspend Business" : "Activate Business"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {business.isActive
                  ? "This will prevent the business from performing any transactions."
                  : "This will restore full access to the business."}
              </p>
            </div>
          </div>

          <p className="text-sm">
            Are you sure you want to{" "}
            {business.isActive ? "suspend" : "activate"}{" "}
            <strong>{business.name}</strong>?
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={statusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={business.isActive ? "destructive" : "default"}
              onClick={() => statusMutation.mutate()}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending
                ? "Processing..."
                : business.isActive
                  ? "Yes, Suspend"
                  : "Yes, Activate"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Delete Business</h3>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the business and ALL associated
                data (transactions, products, staff, contacts, etc.). This
                action cannot be undone.
              </p>
            </div>
          </div>

          <p className="text-sm">
            Are you sure you want to delete <strong>{business.name}</strong>?
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      <AssignPlanModal
        open={planModalOpen}
        onClose={() => {
          setPlanModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["business-plan", id] });
        }}
        businessId={business.id}
        businessName={business.name}
      />
    </div>
  );
}

/* ─── Helper sub-component ─── */

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm">{value || "—"}</p>
      </div>
    </div>
  );
}
