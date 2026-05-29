import apiClient from "@/lib/apiClient";
import type { SubscriptionOverview } from "@/types/api";

export const subscriptionOverviewKeys = {
  all: ["subscription-overview"] as const,
};

export async function getSubscriptionOverview(): Promise<SubscriptionOverview> {
  const { data } = await apiClient.get<SubscriptionOverview>(
    "/admin/subscriptions/overview",
  );
  return data;
}
