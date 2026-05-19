import { useState, useEffect, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateAdmin } from "../api/updateAdmin";
import { adminKeys } from "../api/getAdmins";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Toast, type ToastType } from "@/components/ui/Toast";
import type { AdminAccount, AdminRole, UpdateAdminRequest } from "@/types/api";

const ROLE_OPTIONS: SelectOption[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "SUPPORT_ADMIN", label: "Support Admin" },
  { value: "ANALYST", label: "Analyst" },
];

export interface EditAdminModalProps {
  admin: AdminAccount;
  open: boolean;
  onClose: () => void;
}

export default function EditAdminModal({
  admin,
  open,
  onClose,
}: EditAdminModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState(admin.name);
  const [role, setRole] = useState<AdminRole>(admin.role);
  const [isActive, setIsActive] = useState(admin.isActive !== false);

  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  // Reset form when admin prop changes or modal opens
  useEffect(() => {
    if (open) {
      setName(admin.name);
      setRole(admin.role);
      setIsActive(admin.isActive !== false);
    }
  }, [open, admin]);

  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAdminRequest }) =>
      updateAdmin(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: adminKeys.detail(admin.id),
      });
      setToast({
        message: "Admin account updated successfully.",
        type: "success",
      });
      onClose();
    },
    onError: () => {
      setToast({
        message: "Failed to update admin account. Please try again.",
        type: "error",
      });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const body: UpdateAdminRequest = {
      name: name !== admin.name ? name : undefined,
      role: role !== admin.role ? role : undefined,
      isActive: isActive !== (admin.isActive !== false) ? isActive : undefined,
    };

    mutation.mutate({ id: admin.id, body });
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Edit Admin Account"
        description={`Update details for ${admin.name}.`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-primary">
              Active Account
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
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
