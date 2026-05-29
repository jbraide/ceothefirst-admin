import apiClient from "@/lib/apiClient";
import type { Plan } from "@/types/api";

export async function getBusinessPlan(businessId: string): Promise<Plan> {
  const { data } = await apiClient.get<Plan>(
    `/admin/businesses/${businessId}/plan`,
  );
  return data;
}
