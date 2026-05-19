import apiClient from "@/lib/apiClient";
import type { PendingVerification } from "@/types/api";

export const verificationKeys = {
  all: ["verifications"] as const,
  pending: () => [...verificationKeys.all, "pending"] as const,
};

export async function getPendingVerifications(): Promise<
  PendingVerification[]
> {
  const { data } = await apiClient.get<PendingVerification[]>(
    "/admin/verifications",
  );
  return data;
}
