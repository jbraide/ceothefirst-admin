import { create } from "zustand";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface AdminUser {
  name: string;
  email: string;
}

export interface AuthState {
  /** JWT access token */
  token: string | null;
  /** Long-lived refresh token */
  refreshToken: string | null;
  /** Basic admin profile info */
  user: AdminUser | null;
  /** Derived — `true` when a token is present */
  isAuthenticated: boolean;

  /* ——— Actions ——— */
  login: (payload: {
    token: string;
    refreshToken: string;
    user: AdminUser;
  }) => void;
  logout: () => void;
  setTokens: (token: string, refreshToken: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers — localStorage (SSR-safe)                                 */
/* ------------------------------------------------------------------ */

const AUTH_TOKEN_KEY = "nf_admin_token";
const AUTH_REFRESH_KEY = "nf_admin_refresh";
const AUTH_USER_KEY = "nf_admin_user";

function loadFromStorage(): Pick<AuthState, "token" | "refreshToken" | "user"> {
  if (typeof window === "undefined") {
    return { token: null, refreshToken: null, user: null };
  }

  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const refreshToken = window.localStorage.getItem(AUTH_REFRESH_KEY);
    const rawUser = window.localStorage.getItem(AUTH_USER_KEY);

    let user: AdminUser | null = null;
    if (rawUser) {
      user = JSON.parse(rawUser) as AdminUser;
    }

    return { token, refreshToken, user };
  } catch {
    return { token: null, refreshToken: null, user: null };
  }
}

function persistToStorage(
  token: string | null,
  refreshToken: string | null,
  user: AdminUser | null,
): void {
  if (typeof window === "undefined") return;

  const set = (k: string, v: string | null) => {
    if (v === null) {
      window.localStorage.removeItem(k);
    } else {
      window.localStorage.setItem(k, v);
    }
  };

  try {
    set(AUTH_TOKEN_KEY, token);
    set(AUTH_REFRESH_KEY, refreshToken);
    set(AUTH_USER_KEY, user ? JSON.stringify(user) : null);
  } catch {
    // Silently ignore (e.g. private browsing, quota exceeded).
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                             */
/* ------------------------------------------------------------------ */

const initial = loadFromStorage();

export const useAuthStore = create<AuthState>()((set) => ({
  token: initial.token,
  refreshToken: initial.refreshToken,
  user: initial.user,
  isAuthenticated: !!initial.token,

  /* ----- Actions ----- */

  login: ({ token, refreshToken, user }) => {
    persistToStorage(token, refreshToken, user);
    set({
      token,
      refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    persistToStorage(null, null, null);
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  setTokens: (token, refreshToken) => {
    const currentUser = useAuthStore.getState().user;
    persistToStorage(token, refreshToken, currentUser);
    set({ token, refreshToken });
  },
}));
