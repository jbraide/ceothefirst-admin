import apiClient from "@/lib/apiClient";
import type { SubscribedBusiness, PaginatedResponse } from "@/types/api";

export interface SubscriptionBusinessesParams {
  plan?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const subscribedBusinessKeys = {
  all: ["subscribed-businesses"] as const,
  lists: (params?: SubscriptionBusinessesParams) =>
    [...subscribedBusinessKeys.all, "list", params] as const,
};

export async function getSubscriptionBusinesses(
  params?: SubscriptionBusinessesParams,
): Promise<PaginatedResponse<SubscribedBusiness>> {
  const { data } = await apiClient.get<PaginatedResponse<SubscribedBusiness>>(
    "/admin/subscriptions/businesses",
    { params },
  );
  return data;
}
