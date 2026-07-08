import apiClient from "@/lib/apiClient";
import type { LoginResponse } from "@/types/api";

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    "/auth/admin/verify-otp",
    payload,
  );
  return data;
}
