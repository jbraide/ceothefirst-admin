import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginForm from "@/features/auth/components/LoginForm";

const mockNavigate = vi.fn();
const mockAuthLogin = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (s: { login: typeof mockAuthLogin }) => unknown) =>
    selector({ login: mockAuthLogin }),
}));

let loginResolve: (data: { requiresOtp: boolean; message: string }) => void;
let loginReject: (err: Error) => void;

vi.mock("@/features/auth/api/login", () => ({
  loginAdmin: () =>
    new Promise<{ requiresOtp: boolean; message: string }>(
      (resolve, reject) => {
        loginResolve = resolve;
        loginReject = reject;
      },
    ),
}));

let otpResolve: (data: { accessToken: string; refreshToken: string }) => void;


vi.mock("@/features/auth/api/verifyOtp", () => ({
  verifyOtp: () =>
    new Promise<{ accessToken: string; refreshToken: string }>(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (resolve, _reject) => {
        otpResolve = resolve;
      },
    ),
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderLoginForm() {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockAuthLogin.mockClear();
  });

  describe("rendering", () => {
    it("renders email input", () => {
      renderLoginForm();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
    it("renders password input", () => {
      renderLoginForm();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
    it("renders a submit button", () => {
      renderLoginForm();
      expect(
        screen.getByRole("button", { name: /sign in/i }),
      ).toBeInTheDocument();
    });
  });

  describe("submit button state", () => {
    it("is disabled when email and password are empty", () => {
      renderLoginForm();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    });
    it("is disabled when only email is filled", async () => {
      renderLoginForm();
      const u = userEvent.setup();
      await u.type(screen.getByLabelText(/email address/i), "a@b.com");
      expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    });
    it("is enabled when both filled", async () => {
      renderLoginForm();
      const u = userEvent.setup();
      await u.type(screen.getByLabelText(/email address/i), "a@b.com");
      await u.type(screen.getByLabelText(/password/i), "secret123");
      expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
    });
  });

  describe("failed login", () => {
    it("shows error on failed login", async () => {
      renderLoginForm();
      const u = userEvent.setup();
      await u.type(screen.getByLabelText(/email address/i), "bad@user.com");
      await u.type(screen.getByLabelText(/password/i), "wrongpw");
      await u.click(screen.getByRole("button", { name: /sign in/i }));
      loginReject(new Error("Invalid credentials"));
      await waitFor(() =>
        expect(screen.getByRole("alert")).toBeInTheDocument(),
      );
    });
  });

  describe("OTP step", () => {
    it("shows OTP input after password login", async () => {
      renderLoginForm();
      const u = userEvent.setup();
      await u.type(screen.getByLabelText(/email address/i), "admin@test.com");
      await u.type(screen.getByLabelText(/password/i), "correctpw");
      await u.click(screen.getByRole("button", { name: /sign in/i }));
      loginResolve({ requiresOtp: true, message: "OTP sent" });
      await waitFor(() =>
        expect(screen.getByLabelText(/otp/i)).toBeInTheDocument(),
      );
    });
  });

  describe("successful OTP", () => {
    it("stores token and navigates after OTP", async () => {
      renderLoginForm();
      const u = userEvent.setup();
      await u.type(screen.getByLabelText(/email address/i), "admin@test.com");
      await u.type(screen.getByLabelText(/password/i), "correctpw");
      await u.click(screen.getByRole("button", { name: /sign in/i }));
      loginResolve({ requiresOtp: true, message: "OTP sent" });
      await waitFor(() =>
        expect(screen.getByLabelText(/otp/i)).toBeInTheDocument(),
      );
      await u.type(screen.getByLabelText(/otp/i), "1234");
      await u.click(screen.getByRole("button", { name: /verify/i }));
      otpResolve({ accessToken: "access-123", refreshToken: "refresh-456" });
      await waitFor(() => expect(mockAuthLogin).toHaveBeenCalledTimes(1));
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });
});
