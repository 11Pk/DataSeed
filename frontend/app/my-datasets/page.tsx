"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { apiFetch, type AuthUser } from "../lib/api";

type Dataset = {
  id: string;
  name: string;
  description: string;
  status: string;
  target_rows: number;
  approved_rows: number;
  domain: string;
};

export default function MyDatasetsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

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
    apiFetch<{ datasets: Dataset[] }>("/api/my-datasets")
      .then((data) => setDatasets(data.datasets))
      .catch(() => undefined);
  }, [user]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/auth?mode=login");
  }

  return (
    <AppShell user={user} active="datasets" onLogout={handleLogout}>
      <section className="dashboard-card panel">
        <div className="panel-header">
          <h1 className="panel-title">My Datasets</h1>
        </div>
        <div className="dataset-list">
          {datasets.length === 0 && <p className="welcome-sub">You have not created any datasets yet.</p>}
          {datasets.map((dataset) => (
            <Link key={dataset.id} href={`/my-datasets/${dataset.id}`} className="dataset-row">
              <div>
                <div className="dataset-name">{dataset.name}</div>
                <small>
                  {dataset.domain} · {dataset.approved_rows} / {dataset.target_rows} rows currently available
                </small>
              </div>
              <span className="pill success">{dataset.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
