import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Phone,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import {
  getPendingVerifications,
  verificationKeys,
} from "../api/getPendingVerifications";
import { verifyBusiness } from "../api/verifyBusiness";
import { businessKeys } from "@/features/businesses/api/getBusinesses";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import type { PendingVerification } from "@/types/api";

function daysWaiting(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function daysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function PendingVerificationsList() {
  const queryClient = useQueryClient();

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    business: PendingVerification | null;
  }>({ open: false, business: null });
  const [rejectNotes, setRejectNotes] = useState("");

  const {
    data: verifications,
    isLoading,
    isError,
  } = useQuery({
    queryKey: verificationKeys.pending(),
    queryFn: getPendingVerifications,
    staleTime: 30_000,
  });

  const verifyMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "VERIFIED" | "REJECTED";
      notes?: string;
    }) => verifyBusiness(id, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.pending() });
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      setRejectModal({ open: false, business: null });
      setRejectNotes("");
    },
  });

  const handleApprove = (biz: PendingVerification) => {
    verifyMutation.mutate({ id: biz.id, status: "VERIFIED" });
  };

  const handleReject = (biz: PendingVerification) => {
    setRejectModal({ open: true, business: biz });
    setRejectNotes("");
  };

  const confirmReject = () => {
    if (rejectModal.business) {
      verifyMutation.mutate({
        id: rejectModal.business.id,
        status: "REJECTED",
        notes: rejectNotes.trim() || undefined,
      });
    }
  };

  // ─── Loading State ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  // ─── Error State ───
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">
          Failed to load verifications
        </h2>
        <p className="mt-1 text-muted-foreground">
          Please check your connection and try again.
        </p>
      </div>
    );
  }

  // ─── Empty State ───
  if (!verifications || verifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <ShieldCheck className="h-8 w-8 text-success" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">All businesses verified</h2>
        <p className="mt-1 text-muted-foreground">
          There are no pending KYC verifications at this time.
        </p>
      </div>
    );
  }

  // ─── List ───
  return (
    <div className="space-y-4">
      {verifications.map((biz: PendingVerification) => {
        const days = daysWaiting(biz.createdAt);
        const isUrgent = days >= 3;

        return (
          <Card
            key={biz.id}
            className={cn(
              "transition-colors",
              isUrgent && "border-warning/50 bg-warning/5",
            )}
          >
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Business Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{biz.name}</h3>
                    {isUrgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                        <Clock className="h-3 w-3" />
                        Urgent
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {biz.ownerPhone}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {daysLabel(days)}
                    </span>
                  </div>

                  {/* Verification Docs */}
                  {biz.verificationDocs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {biz.verificationDocs.map((docUrl, idx) => (
                        <a
                          key={idx}
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Doc {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(biz)}
                    disabled={verifyMutation.isPending}
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(biz)}
                    disabled={verifyMutation.isPending}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ─── Reject Confirmation Modal ─── */}
      <Modal
        open={rejectModal.open}
        onClose={() => {
          setRejectModal({ open: false, business: null });
          setRejectNotes("");
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Reject Verification</h3>
              <p className="text-sm text-muted-foreground">
                {rejectModal.business?.name} will be notified of this decision.
              </p>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label
              htmlFor="reject-notes"
              className="block text-sm font-medium mb-1.5"
            >
              Notes (optional)
            </label>
            <textarea
              id="reject-notes"
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Provide a reason for rejection..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModal({ open: false, business: null });
                setRejectNotes("");
              }}
              disabled={verifyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
