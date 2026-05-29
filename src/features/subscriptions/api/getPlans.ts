import apiClient from "@/lib/apiClient";
import type { Plan } from "@/types/api";

export const planKeys = {
  all: ["plans"] as const,
  lists: () => [...planKeys.all, "list"] as const,
  details: () => [...planKeys.all, "detail"] as const,
  detail: (id: string) => [...planKeys.details(), id] as const,
};

export async function getPlans(): Promise<Plan[]> {
  const { data } = await apiClient.get<Plan[]>("/admin/plans");
  return data;
}
