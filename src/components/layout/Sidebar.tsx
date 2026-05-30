import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Shield,
  BarChart3,
  Search,
  ScrollText,
  Bell,
  CreditCard,
  Menu,
  X,
  LogOut,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import type { AdminRole } from "@/types/api";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*  Nav item definition                                               */
/* ------------------------------------------------------------------ */

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const allNavItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/businesses", label: "Businesses", icon: Building2 },
  { to: "/owners", label: "Owners", icon: Users },
  { to: "/verifications", label: "Verifications", icon: ShieldCheck },
  { to: "/admins", label: "Admin Management", icon: Shield },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/search", label: "Search", icon: Search },
  { to: "/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/subscriptions", label: "Subscriptions", icon: CreditCard },
];

const roleAccess: Record<AdminRole, string[]> = {
  SUPER_ADMIN: [
    "dashboard",
    "businesses",
    "owners",
    "verifications",
    "analytics",
    "search",
    "audit",
    "notifications",
    "admins",
    "subscriptions",
  ],
  SUPPORT_ADMIN: [
    "dashboard",
    "analytics",
    "businesses",
    "owners",
    "search",
    "audit",
  ],
  ANALYST: ["dashboard", "analytics"],
};

const itemKeyMap: Record<string, string> = {
  "/": "dashboard",
  "/businesses": "businesses",
  "/owners": "owners",
  "/verifications": "verifications",
  "/admins": "admins",
  "/analytics": "analytics",
  "/search": "search",
  "/audit": "audit",
  "/notifications": "notifications",
  "/subscriptions": "subscriptions",
};

/* ------------------------------------------------------------------ */
/*  Sidebar                                                           */
/* ------------------------------------------------------------------ */

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const allowedKeys = user ? roleAccess[user.role] : [];
  const navItems = allNavItems.filter(
    (item) => allowedKeys.includes(itemKeyMap[item.to]) ?? false,
  );

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login", { replace: true });
  };

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-indigo-600 text-white"
        : "text-gray-300 hover:bg-gray-800 hover:text-white",
    );

  const sidebarContent = (
    <>
      {/* ─── Brand ────────────────────────────────────────── */}
      <div className="flex h-16 items-center justify-between px-4">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-white"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold">
            NF
          </span>
          CEOTHEFIRST
        </NavLink>

        {/* Close button — mobile only */}
        <button
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ─── Divider ──────────────────────────────────────── */}
      <div className="mx-4 h-px bg-gray-800" />

      {/* ─── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={linkClasses}
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ─── Divider ──────────────────────────────────────── */}
      <div className="mx-4 h-px bg-gray-800" />

      {/* ─── User / Logout ────────────────────────────────── */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-400 hover:bg-gray-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* ─── Mobile hamburger ─────────────────────────────── */}
      <button
        className="fixed left-3 top-3 z-50 rounded-lg bg-gray-900 p-2 text-gray-400 hover:text-white lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* ─── Mobile overlay ───────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar panel ────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gray-950 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
