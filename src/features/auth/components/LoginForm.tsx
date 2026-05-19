import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { LogIn, AlertCircle } from "lucide-react";

import { loginAdmin } from "@/features/auth/api/login";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: loginAdmin,
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    mutation.mutate({ email: email.trim(), password });
  };

  const errorMessage =
    mutation.error instanceof Error
      ? mutation.error.message
      : "An unexpected error occurred. Please try again.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        {/* ─── Branding ────────────────────────────────────── */}
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            NF
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            NairaFlow Admin
          </CardTitle>
          <CardDescription>Sign in to your admin dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          {/* ─── Error alert ────────────────────────────────── */}
          {mutation.isError && (
            <div
              className={cn(
                "mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
              )}
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ─── Form ──────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
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
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
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
                disabled={mutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || !email.trim() || !password.trim()}
            >
              {mutation.isPending ? (
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
        </CardContent>
      </Card>
    </div>
  );
}
