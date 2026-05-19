import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";
import type { AdminRole } from "@/types/api";

const AUTH_TOKEN_KEY = "nf_admin_token";
const AUTH_REFRESH_KEY = "nf_admin_refresh";
const AUTH_USER_KEY = "nf_admin_user";

function clearAuthStorage() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function makeUser(
  name: string,
  email: string,
  role: AdminRole = "SUPER_ADMIN",
) {
  return { name, email, role };
}

describe("useAuthStore", () => {
  beforeEach(() => {
    clearAuthStorage();
    useAuthStore.setState({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  });

  describe("initial state", () => {
    it("has token as null", () => {
      const { token } = useAuthStore.getState();
      expect(token).toBeNull();
    });

    it("has isAuthenticated as false", () => {
      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
    });

    it("has user as null", () => {
      const { user } = useAuthStore.getState();
      expect(user).toBeNull();
    });

    it("has refreshToken as null", () => {
      const { refreshToken } = useAuthStore.getState();
      expect(refreshToken).toBeNull();
    });
  });

  describe("login()", () => {
    it("sets tokens and isAuthenticated becomes true", () => {
      const user = makeUser("Alice", "alice@example.com");
      useAuthStore.getState().login({
        token: "access-abc",
        refreshToken: "refresh-xyz",
        user,
      });

      const state = useAuthStore.getState();
      expect(state.token).toBe("access-abc");
      expect(state.refreshToken).toBe("refresh-xyz");
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });

    it("persists tokens and user to localStorage", () => {
      const user = makeUser("Bob", "bob@example.com");
      useAuthStore.getState().login({
        token: "tok-1",
        refreshToken: "ref-1",
        user,
      });

      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe("tok-1");
      expect(localStorage.getItem(AUTH_REFRESH_KEY)).toBe("ref-1");
      expect(JSON.parse(localStorage.getItem(AUTH_USER_KEY)!)).toEqual(user);
    });
  });

  describe("logout()", () => {
    it("clears tokens and isAuthenticated becomes false", () => {
      useAuthStore.getState().login({
        token: "tok-abc",
        refreshToken: "ref-xyz",
        user: makeUser("Carol", "carol@example.com"),
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("clears localStorage keys", () => {
      useAuthStore.getState().login({
        token: "tok",
        refreshToken: "ref",
        user: makeUser("Dan", "dan@example.com"),
      });
      useAuthStore.getState().logout();

      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_REFRESH_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
    });
  });

  describe("setTokens()", () => {
    it("updates tokens while preserving user", () => {
      const user = makeUser("Eve", "eve@example.com");
      useAuthStore.getState().login({
        token: "old-token",
        refreshToken: "old-refresh",
        user,
      });

      useAuthStore.getState().setTokens("new-token", "new-refresh");

      const state = useAuthStore.getState();
      expect(state.token).toBe("new-token");
      expect(state.refreshToken).toBe("new-refresh");
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });

    it("persists updated tokens to localStorage", () => {
      useAuthStore.getState().login({
        token: "old-tok",
        refreshToken: "old-ref",
        user: makeUser("Frank", "frank@example.com"),
      });

      useAuthStore.getState().setTokens("fresh-tok", "fresh-ref");

      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe("fresh-tok");
      expect(localStorage.getItem(AUTH_REFRESH_KEY)).toBe("fresh-ref");
      const stored = JSON.parse(localStorage.getItem(AUTH_USER_KEY)!);
      expect(stored.name).toBe("Frank");
    });
  });

  describe("hydration from localStorage", () => {
    it("hydrates from localStorage when store is created after setting storage", () => {
      const user = makeUser("Grace", "grace@example.com");
      localStorage.setItem(AUTH_TOKEN_KEY, "hydrated-token");
      localStorage.setItem(AUTH_REFRESH_KEY, "hydrated-refresh");
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

      useAuthStore.setState({
        token: "hydrated-token",
        refreshToken: "hydrated-refresh",
        user,
        isAuthenticated: true,
      });

      const state = useAuthStore.getState();
      expect(state.token).toBe("hydrated-token");
      expect(state.refreshToken).toBe("hydrated-refresh");
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });
  });
});
