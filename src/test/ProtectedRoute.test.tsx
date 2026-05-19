import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

// ── Mocks ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockOutlet = vi.fn();

vi.mock("react-router-dom", () => ({
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigate(props);
    return <div data-testid="navigate" data-to={props.to} />;
  },
  Outlet: () => {
    mockOutlet();
    return <div data-testid="outlet" />;
  },
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from "@/store/authStore";

// ── Helpers ─────────────────────────────────────────────────────────────

function mockAuthenticated(isAuth: boolean) {
  const mockSelector = vi.fn(
    (selector: (s: { isAuthenticated: boolean }) => boolean) =>
      selector({ isAuthenticated: isAuth }),
  );
  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    mockSelector,
  );
}

// ── Tests ───────────────────────────────────────────────────────────────

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockOutlet.mockClear();
  });

  describe("when authenticated", () => {
    beforeEach(() => {
      mockAuthenticated(true);
    });

    it("renders children when provided", () => {
      render(
        <ProtectedRoute>
          <div data-testid="child">Dashboard Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByTestId("child")).toHaveTextContent(
        "Dashboard Content",
      );
      expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
      expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
    });

    it("renders Outlet when no children provided", () => {
      render(<ProtectedRoute />);

      expect(screen.getByTestId("outlet")).toBeInTheDocument();
      expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
    });
  });

  describe("when not authenticated", () => {
    beforeEach(() => {
      mockAuthenticated(false);
    });

    it("redirects to /login", () => {
      render(<ProtectedRoute />);

      expect(screen.getByTestId("navigate")).toBeInTheDocument();
      expect(screen.getByTestId("navigate").dataset.to).toBe("/login");
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: "/login", replace: true }),
      );
    });

    it("does not render children even when provided", () => {
      render(
        <ProtectedRoute>
          <div data-testid="child">Should not appear</div>
        </ProtectedRoute>,
      );

      expect(screen.queryByTestId("child")).not.toBeInTheDocument();
      expect(screen.getByTestId("navigate")).toBeInTheDocument();
    });

    it("does not render Outlet", () => {
      render(<ProtectedRoute />);

      expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
    });
  });
});
