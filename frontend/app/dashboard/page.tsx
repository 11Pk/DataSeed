"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { apiFetch, type AuthUser } from "../lib/api";

type Stats = {
  totalContributions: number;
  contributionsToday: number;
  myTasks: number;
  activeDatasets: number;
};

type Dataset = {
  id: string;
  name: string;
  status: string;
  target_rows: number;
  approved_rows: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          router.replace("/auth?mode=login");
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data?.user) setUser(data.user as AuthUser);
      })
      .catch(() => router.replace("/auth?mode=login"));
  }, [router]);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      apiFetch<{ stats: Stats }>("/api/dashboard"),
      apiFetch<{ datasets: Dataset[] }>("/api/my-datasets"),
    ])
      .then(([dashboard, owned]) => {
        setStats(dashboard.stats);
        setDatasets(owned.datasets.slice(0, 5));
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : "Could not load dashboard.");
      });
  }, [user]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.replace("/auth?mode=login");
    } catch {
      setError("Could not log out.");
      setLoggingOut(false);
    }
  }

  const statBoxes = [
    {
      label: "Total contributions",
      value: String(stats?.totalContributions ?? "—"),
      change: `+${stats?.contributionsToday ?? 0} today`,
    },
    { label: "Reputation", value: "92", change: "Excellent" },
    { label: "Daily streak", value: "7 days", change: "Keep it up!" },
    { label: "Creator commitment", value: "10 / 10", change: "Completed today" },
  ];

  return (
    <AppShell user={user} active="dashboard" onLogout={handleLogout} loggingOut={loggingOut}>
      <section className="dashboard-card dashboard-welcome">
        <div className="welcome-row">
          <div>
            <h1 className="welcome-title">Welcome, {user?.name ?? "..."}</h1>
            <p className="welcome-sub">You&apos;re building better data with the community.</p>
            {error && <p className="auth-error" role="alert">{error}</p>}
          </div>
        </div>

        <div className="quick-stats">
          {statBoxes.map((stat) => (
            <div key={stat.label} className="stat-box">
              <span className="stat-label">{stat.label}</span>
              <div className="stat-value">{stat.value}</div>
              <span className="stat-badge">{stat.change}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-card panel">
          <div className="panel-header">
            <h2 className="panel-title">Your Active Datasets</h2>
            <Link href="/my-datasets" className="link-btn">View all</Link>
          </div>

          <div className="dataset-list">
            {datasets.length === 0 && <p className="welcome-sub">No datasets yet.</p>}
            {datasets.map((dataset) => (
              <Link key={dataset.id} href={`/my-datasets/${dataset.id}`} className="dataset-row">
                <div>
                  <div className="dataset-name">{dataset.name}</div>
                  <small>
                    {dataset.approved_rows} / {dataset.target_rows} rows
                  </small>
                </div>
                <div>
                  <span className="pill success">{dataset.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside className="dashboard-card panel dataset-side-card">
          <div className="panel-header">
            <h2 className="panel-title">Today&apos;s Tasks</h2>
            <Link href="/contribute" className="link-btn">View all</Link>
          </div>
          <div className="side-metric">
            <span className="metric-label">My tasks</span>
            <span className="metric-value">{stats?.myTasks ?? "—"}</span>
          </div>
          <div className="side-metric">
            <span className="metric-label">Contributions today</span>
            <span className="metric-value">{stats?.contributionsToday ?? "—"}</span>
          </div>
          <div className="side-metric">
            <span className="metric-label">Active datasets</span>
            <span className="metric-value">{stats?.activeDatasets ?? "—"}</span>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
