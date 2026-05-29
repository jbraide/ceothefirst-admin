import apiClient from "@/lib/apiClient";
import type { ToggleFeatureRequest } from "@/types/api";

export async function togglePlanFeature(
  planId: string,
  featureId: string,
  body: ToggleFeatureRequest,
): Promise<void> {
  await apiClient.patch(
    `/admin/plans/${planId}/features/${featureId}`,
    body,
  );
}
