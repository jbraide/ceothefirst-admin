import apiClient from "@/lib/apiClient";
import type { PlatformOverview } from "@/types/api";

export async function getOverview(): Promise<PlatformOverview> {
  const { data } = await apiClient.get<PlatformOverview>("/admin/stats");
  return data;
}
