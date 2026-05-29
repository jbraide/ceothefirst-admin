import apiClient from "@/lib/apiClient";
import type { AssignPlanRequest, AssignPlanResponse } from "@/types/api";

export async function assignPlan(
  businessId: string,
  body: AssignPlanRequest,
): Promise<AssignPlanResponse> {
  const { data } = await apiClient.patch<AssignPlanResponse>(
    `/admin/businesses/${businessId}/plan`,
    body,
  );
  return data;
}
