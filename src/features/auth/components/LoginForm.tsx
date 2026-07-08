import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { LogIn, AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";

import { loginAdmin } from "@/features/auth/api/login";
import { verifyOtp } from "@/features/auth/api/verifyOtp";
import { useAuthStore } from "@/store/authStore";
import type { AdminRole } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";

function decodeJwtPayload(token: string): { role?: string; sub?: string } {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export default function LoginForm() {
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);

  // Step 1: password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: OTP
  const [step, setStep] = useState<"password" | "otp">("password");
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (data) => {
      setOtpMessage(data.message);
      setStep("otp");
    },
  });

  const otpMutation = useMutation({
    mutationFn: (code: string) =>
      verifyOtp({ email: email.trim(), otp: code }),
    onSuccess: (data) => {
      const payload = decodeJwtPayload(data.accessToken);
      authLogin({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          name: email.trim(),
          email: email.trim(),
          role: (payload.role as AdminRole) ?? "ANALYST",
        },
      });
      navigate("/", { replace: true });
    },
  });

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    loginMutation.mutate({ email: email.trim(), password });
  };

  const handleOtpSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp.trim() || otp.length < 4) return;
    otpMutation.mutate(otp.trim());
  };

  const handleBackToPassword = () => {
    setStep("password");
    setOtp("");
    loginMutation.reset();
  };

  const errorMessage =
    loginMutation.error instanceof Error
      ? loginMutation.error.message
      : otpMutation.error instanceof Error
        ? otpMutation.error.message
        : "An unexpected error occurred. Please try again.";

  const hasError = loginMutation.isError || otpMutation.isError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            NF
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            CEOTHEFIRST Admin
          </CardTitle>
          <CardDescription>
            {step === "password"
              ? "Sign in to your admin dashboard"
              : "Enter the verification code sent to your email"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {hasError && (
            <div
              className={cn(
                "mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700",
              )}
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === "password" ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loginMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loginMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending || !email.trim() || !password.trim()}
              >
                {loginMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              {otpMessage && (
                <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{otpMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Verification Code (OTP)
                </label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 4-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  autoComplete="one-time-code"
                  disabled={otpMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={otpMutation.isPending || otp.length < 4}
              >
                {otpMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verify
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleBackToPassword}
                className="flex w-full items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                disabled={otpMutation.isPending}
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
