"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { apiFetch, type AuthUser } from "../lib/api";

type Task = {
  id: string;
  title: string;
  task_type: string;
  dataset_name: string;
  assignment_status: string;
};

type Contribution = {
  id: string;
  dataset_name: string;
  status: string;
  source: string;
  created_at: string;
};

export default function ContributePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

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
      apiFetch<{ tasks: Task[] }>("/api/my-tasks"),
      apiFetch<{ contributions: Contribution[] }>("/api/my-contributions"),
    ]).then(([taskData, contributionData]) => {
      setTasks(taskData.tasks);
      setContributions(contributionData.contributions);
    }).catch(() => undefined);
  }, [user]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/auth?mode=login");
  }

  return (
    <AppShell user={user} active="contribute" onLogout={handleLogout} loggingOut={loggingOut}>
      <section className="dashboard-card dashboard-welcome">
        <div className="welcome-row">
          <div>
            <h1 className="welcome-title">Let&apos;s build better datasets</h1>
            <p className="welcome-sub">Complete assigned generation and validation tasks.</p>
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-box">
            <span className="stat-label">My tasks</span>
            <div className="stat-value">{tasks.length}</div>
            <span className="stat-badge">assigned and incomplete</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Points earned</span>
            <div className="stat-value">520</div>
            <span className="stat-badge">+25 today</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Streak</span>
            <div className="stat-value">7 days</div>
            <span className="stat-badge">keep it up</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Reputation</span>
            <div className="stat-value">92</div>
            <span className="stat-badge">excellent</span>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-card panel">
          <div className="panel-header">
            <h2 className="panel-title">My Tasks</h2>
          </div>
          <div className="dataset-list">
            {tasks.length === 0 && <p className="welcome-sub">No tasks assigned yet.</p>}
            {tasks.map((task) => (
              <div key={task.id} className="dataset-row">
                <div>
                  <div className="dataset-name">{task.title}</div>
                  <small>
                    {task.dataset_name} · {task.task_type === "validation" ? "Validation" : "Human generation"}
                  </small>
                </div>
                <div>
                  <span className="pill success">{task.assignment_status}</span>
                </div>
                <div>
                  <Link href={`/contribute/task/${task.id}`} className="primary-btn small-btn">
                    Start Task
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="dashboard-card panel dataset-side-card">
          <div className="panel-header">
            <h2 className="panel-title">Recent Activity</h2>
          </div>
          {contributions.length === 0 && <p className="welcome-sub">No contributions yet.</p>}
          {contributions.map((item) => (
            <div key={item.id} className="side-metric">
              <span className="metric-label">{item.dataset_name}</span>
              <span className="metric-value">{item.status}</span>
            </div>
          ))}
        </aside>
      </div>
    </AppShell>
  );
}
