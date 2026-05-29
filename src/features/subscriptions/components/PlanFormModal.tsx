import { useState, useEffect, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createPlan } from "../api/createPlan";
import { updatePlan } from "../api/updatePlan";
import { planKeys } from "../api/getPlans";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Toast, type ToastType } from "@/components/ui/Toast";
import type { Plan, CreatePlanRequest } from "@/types/api";

export interface PlanFormModalProps {
  open: boolean;
  onClose: () => void;
  plan?: Plan;
}

const emptyForm: CreatePlanRequest = {
  name: "",
  label: "",
  price: "",
  maxTransactions: undefined,
  maxProducts: undefined,
  maxStaff: undefined,
  maxContacts: undefined,
  maxProjects: undefined,
  maxProperties: undefined,
  maxInvoicePDFs: undefined,
};

export default function PlanFormModal({
  open,
  onClose,
  plan,
}: PlanFormModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!plan;

  const [form, setForm] = useState<CreatePlanRequest>(emptyForm);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  useEffect(() => {
    if (open) {
      if (plan) {
        setForm({
          name: plan.name,
          label: plan.label,
          price: plan.price,
          maxTransactions: plan.maxTransactions,
          maxProducts: plan.maxProducts,
          maxStaff: plan.maxStaff,
          maxContacts: plan.maxContacts,
          maxProjects: plan.maxProjects,
          maxProperties: plan.maxProperties,
          maxInvoicePDFs: plan.maxInvoicePDFs,
        });
      } else {
        setForm(emptyForm);
      }
      setToast(null);
    }
  }, [open, plan]);

  const handleChange = (field: keyof CreatePlanRequest) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    if (
      field === "maxTransactions" ||
      field === "maxProducts" ||
      field === "maxStaff" ||
      field === "maxContacts" ||
      field === "maxProjects" ||
      field === "maxProperties" ||
      field === "maxInvoicePDFs"
    ) {
      setForm((prev) => ({
        ...prev,
        [field]: value === "" ? undefined : Number(value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const mutation = useMutation({
    mutationFn: (body: CreatePlanRequest) =>
      isEdit ? updatePlan(plan!.id, body) : createPlan(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      setToast({
        message: isEdit
          ? "Plan updated successfully."
          : "Plan created successfully.",
        type: "success",
      });
      onClose();
    },
    onError: (err) => {
      console.error("Failed to save plan:", err);
      setToast({
        message: isEdit
          ? "Failed to update plan. Please try again."
          : "Failed to create plan. Please try again.",
        type: "error",
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? "Edit Plan" : "Create Plan"}
        description={
          isEdit
            ? "Update the plan details below."
            : "Fill in the details to create a new plan."
        }
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="e.g. basic"
              required
            />
            <Input
              label="Label"
              value={form.label}
              onChange={handleChange("label")}
              placeholder="e.g. Basic Plan"
              required
            />
          </div>

          <Input
            label="Price"
            value={form.price}
            onChange={handleChange("price")}
            placeholder="e.g. 5000.00"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Transactions"
              type="number"
              value={form.maxTransactions ?? ""}
              onChange={handleChange("maxTransactions")}
              placeholder="0"
            />
            <Input
              label="Max Products"
              type="number"
              value={form.maxProducts ?? ""}
              onChange={handleChange("maxProducts")}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Staff"
              type="number"
              value={form.maxStaff ?? ""}
              onChange={handleChange("maxStaff")}
              placeholder="0"
            />
            <Input
              label="Max Contacts"
              type="number"
              value={form.maxContacts ?? ""}
              onChange={handleChange("maxContacts")}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Projects"
              type="number"
              value={form.maxProjects ?? ""}
              onChange={handleChange("maxProjects")}
              placeholder="0"
            />
            <Input
              label="Max Properties"
              type="number"
              value={form.maxProperties ?? ""}
              onChange={handleChange("maxProperties")}
              placeholder="0"
            />
          </div>

          <Input
            label="Max Invoice PDFs"
            type="number"
            value={form.maxInvoicePDFs ?? ""}
            onChange={handleChange("maxInvoicePDFs")}
            placeholder="0"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEdit ? "Update Plan" : "Create Plan"}
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
