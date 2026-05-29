import apiClient from "@/lib/apiClient";
import type { Plan, CreatePlanRequest } from "@/types/api";

export async function createPlan(body: CreatePlanRequest): Promise<Plan> {
  const { data } = await apiClient.post<Plan>("/admin/plans", body);
  return data;
}
