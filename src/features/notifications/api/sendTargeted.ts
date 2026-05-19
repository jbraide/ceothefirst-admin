import apiClient from '@/lib/apiClient'
import type {
  TargetedNotificationRequest,
  TargetedNotificationResponse,
} from '@/types/api'

export async function sendTargeted(
  payload: TargetedNotificationRequest,
): Promise<TargetedNotificationResponse> {
  const response = await apiClient.post<TargetedNotificationResponse>(
    '/admin/notifications/targeted',
    payload,
  )
  return response.data
}
