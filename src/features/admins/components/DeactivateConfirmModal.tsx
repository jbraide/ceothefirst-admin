import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { deactivateAdmin } from "../api/deactivateAdmin";
import { adminKeys } from "../api/getAdmins";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { AdminAccount } from "@/types/api";

export interface DeactivateConfirmModalProps {
  admin: AdminAccount;
  open: boolean;
  onClose: () => void;
}

export default function DeactivateConfirmModal({
  admin,
  open,
  onClose,
}: DeactivateConfirmModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => deactivateAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: adminKeys.detail(admin.id),
      });
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deactivate Admin Account"
      description={`Confirm deactivation of ${admin.name}'s account.`}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm text-primary/80">
            Are you sure you want to deactivate{" "}
            <span className="font-semibold text-primary">{admin.name}</span>?
            They will no longer be able to access the admin panel.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => mutation.mutate(admin.id)}
            loading={mutation.isPending}
          >
            Deactivate Account
          </Button>
        </div>
      </div>
    </Modal>
  );
}
