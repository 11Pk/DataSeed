"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { AuthUser } from "../lib/api";

type NavKey = "dashboard" | "create" | "contribute" | "datasets";

const navItems: { key: NavKey; label: string; href: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "◫" },
  { key: "create", label: "Create Dataset", href: "/create_dataset", icon: "+" },
  { key: "contribute", label: "Contribute", href: "/contribute", icon: "↗" },
  { key: "datasets", label: "My Datasets", href: "/my-datasets", icon: "▣" },
];

function initials(name?: string) {
  if (!name) return "DS";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AppShell({
  user,
  active,
  onLogout,
  loggingOut = false,
  children,
}: {
  user: AuthUser | null;
  active: NavKey;
  onLogout: () => void;
  loggingOut?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <Link href="/" className="brand-wrap">
          <div className="brand-logo" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <span className="brand-name">Dataseeds</span>
        </Link>

        <div className="nav-actions">
          <span className="user-name">{user?.name ?? "Loading..."}</span>
          <Link href="/dashboard" className="ghost-btn">
            Dashboard
          </Link>
          <button
            className="ghost-btn dashboard-logout"
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav" aria-label="Sidebar navigation">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`sidebar-item ${item.key === active ? "active" : ""}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-badge">
                <div className="avatar">{initials(user?.name)}</div>
                <div className="user-meta">
                  <span className="user-name">{user?.name ?? "Loading account..."}</span>
                  <span className="user-role">{user?.email ?? ""}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
