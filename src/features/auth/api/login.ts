import { apiClient } from "@/lib/apiClient";
import type { LoginRequest, LoginResponse } from "@/types/api";

/**
 * Authenticate an admin user with email and password.
 *
 * The response interceptor in `apiClient` unwraps the `data` field from
 * the API envelope, so this function returns the payload directly.
 */
export async function loginAdmin(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/auth/admin/login",
    payload,
  );
  return response.data;
}
