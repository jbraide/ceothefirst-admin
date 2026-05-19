import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginForm from "@/features/auth/components/LoginForm";

// ── Mocks ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockAuthLogin = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (s: { login: typeof mockAuthLogin }) => unknown) =>
    selector({ login: mockAuthLogin }),
}));

// Control the login API response
let loginResolve: (data: { accessToken: string; refreshToken: string }) => void;
let loginReject: (err: Error) => void;

vi.mock("@/features/auth/api/login", () => ({
  loginAdmin: () =>
    new Promise<{ accessToken: string; refreshToken: string }>(
      (resolve, reject) => {
        loginResolve = resolve;
        loginReject = reject;
      },
    ),
}));

// ── Helpers ─────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderLoginForm() {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

// ── Tests ───────────────────────────────────────────────────────────────

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
      const button = screen.getByRole("button", { name: /sign in/i });
      expect(button).toBeDisabled();
    });

    it("is disabled when only email is filled", async () => {
      renderLoginForm();
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email address/i), "a@b.com");

      expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    });

    it("is disabled when only password is filled", async () => {
      renderLoginForm();
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/password/i), "secret123");

      expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    });

    it("is enabled when both email and password are filled", async () => {
      renderLoginForm();
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email address/i), "a@b.com");
      await user.type(screen.getByLabelText(/password/i), "secret123");

      expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
    });
  });

  describe("failed login", () => {
    it("shows error message on failed login", async () => {
      renderLoginForm();
      const user = userEvent.setup();

      await user.type(screen.getByLabelText(/email address/i), "bad@user.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpw");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Reject the API call
      loginReject(new Error("Invalid credentials"));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid credentials",
      );
    });
  });

  describe("successful login", () => {
    it("calls authStore.login() and navigates on success", async () => {
      renderLoginForm();
      const user = userEvent.setup();

      await user.type(
        screen.getByLabelText(/email address/i),
        "admin@test.com",
      );
      await user.type(screen.getByLabelText(/password/i), "correctpw");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Resolve the API call
      loginResolve({
        accessToken: "access-123",
        refreshToken: "refresh-456",
      });

      await waitFor(() => {
        expect(mockAuthLogin).toHaveBeenCalledTimes(1);
      });

      expect(mockAuthLogin).toHaveBeenCalledWith({
        token: "access-123",
        refreshToken: "refresh-456",
        user: { name: "admin@test.com", email: "admin@test.com", role: "ANALYST" },
      });

      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });
});
