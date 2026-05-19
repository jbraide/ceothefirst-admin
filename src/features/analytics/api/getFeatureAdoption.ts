import apiClient from "@/lib/apiClient";
import type { FeatureAdoption } from "@/types/api";

export async function getFeatureAdoption(): Promise<FeatureAdoption> {
  const { data } = await apiClient.get<FeatureAdoption>(
    "/admin/analytics/feature-adoption",
  );
  return data;
}
