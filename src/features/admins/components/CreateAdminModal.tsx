import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createAdmin } from "../api/createAdmin";
import { adminKeys } from "../api/getAdmins";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Toast, type ToastType } from "@/components/ui/Toast";
import type { AdminRole, CreateAdminRequest } from "@/types/api";

const ROLE_OPTIONS: SelectOption[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "SUPPORT_ADMIN", label: "Support Admin" },
  { value: "ANALYST", label: "Analyst" },
];

export interface CreateAdminModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateAdminModal({
  open,
  onClose,
}: CreateAdminModalProps) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("SUPPORT_ADMIN");

  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: (body: CreateAdminRequest) => createAdmin(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      setToast({
        message: "Admin account created successfully.",
        type: "success",
      });
      handleClose();
    },
    onError: () => {
      setToast({
        message: "Failed to create admin account. Please try again.",
        type: "error",
      });
    },
  });

  function handleClose() {
    setEmail("");
    setPassword("");
    setName("");
    setRole("SUPPORT_ADMIN");
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({ email, password, name, role });
  }

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="Create Admin Account"
        description="Fill in the details to create a new admin account."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Create Admin
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
