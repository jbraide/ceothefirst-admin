import apiClient from "@/lib/apiClient";
import type { Plan, CreatePlanRequest } from "@/types/api";

export async function updatePlan(
  id: string,
  body: Partial<CreatePlanRequest>,
): Promise<Plan> {
  const { data } = await apiClient.patch<Plan>(`/admin/plans/${id}`, body);
  return data;
}
