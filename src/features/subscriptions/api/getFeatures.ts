import apiClient from "@/lib/apiClient";
import type { FeatureFlag } from "@/types/api";

export const featureKeys = {
  all: ["features"] as const,
};

export async function getFeatures(): Promise<FeatureFlag[]> {
  const { data } = await apiClient.get<FeatureFlag[]>("/admin/features");
  return data;
}
