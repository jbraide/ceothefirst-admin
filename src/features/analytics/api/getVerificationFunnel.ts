import apiClient from "@/lib/apiClient";
import type { VerificationFunnelItem } from "@/types/api";

export async function getVerificationFunnel(): Promise<
  VerificationFunnelItem[]
> {
  const { data } = await apiClient.get<VerificationFunnelItem[]>(
    "/admin/analytics/verification-funnel",
  );
  return data;
}
