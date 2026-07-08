import { apiClient } from "@/lib/apiClient";
import type { LoginRequest, LoginStep1Response } from "@/types/api";

/**
 * Authenticate an admin user with email and password.
 *
 * The response interceptor in `apiClient` unwraps the `data` field from
 * the API envelope, so this function returns the payload directly.
 */
export async function loginAdmin(
  payload: LoginRequest,
): Promise<LoginStep1Response> {
  const response = await apiClient.post<LoginStep1Response>(
    "/auth/admin/login",
    payload,
  );
  return response.data;
}
