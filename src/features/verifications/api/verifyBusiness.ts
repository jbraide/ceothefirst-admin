import apiClient from '@/lib/apiClient'
import type { BusinessDetail, VerifyBusinessRequest } from '@/types/api'

export async function verifyBusiness(
  id: string,
  body: VerifyBusinessRequest,
): Promise<BusinessDetail> {
  const { data } = await apiClient.patch<BusinessDetail>(
    `/admin/businesses/${id}/verify`,
    body,
  )
  return data
}
