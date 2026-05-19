import apiClient from "@/lib/apiClient";
import type {
  BroadcastNotificationRequest,
  BroadcastNotificationResponse,
} from "@/types/api";

export async function sendBroadcast(
  payload: BroadcastNotificationRequest,
): Promise<BroadcastNotificationResponse> {
  const response = await apiClient.post<BroadcastNotificationResponse>(
    "/admin/notifications/broadcast",
    payload,
  );
  return response.data;
}
