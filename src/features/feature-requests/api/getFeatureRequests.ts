import apiClient from "@/lib/apiClient";
import type { FeatureRequestItem, PaginatedResponse } from "@/types/api";

export interface FeatureRequestParams {
  status?: string;
  module?: string;
  page?: number;
  limit?: number;
}

export const featureRequestKeys = {
  all: ["feature-requests"] as const,
  lists: () => [...featureRequestKeys.all, "list"] as const,
  list: (params: FeatureRequestParams) => [...featureRequestKeys.lists(), params] as const,
};

export async function getFeatureRequests(
  params?: FeatureRequestParams,
): Promise<PaginatedResponse<FeatureRequestItem>> {
  const { data } = await apiClient.get<PaginatedResponse<FeatureRequestItem>>(
    "/admin/feature-requests",
    { params },
  );
  return data;
}
