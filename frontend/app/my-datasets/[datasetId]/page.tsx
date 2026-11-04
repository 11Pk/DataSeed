"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { apiFetch, type AuthUser } from "../../lib/api";

type DatasetDetail = {
  dataset: {
    id: string;
    name: string;
    description: string;
    domain: string;
    purpose: string;
    target_rows: number;
    status: string;
  };
  columns: { id: string; name: string; data_type: string; role: string }[];
  rows: { id: string; source: string; data: Record<string, unknown> }[];
};

export default function DatasetDetailPage() {
  const router = useRouter();
  const params = useParams<{ datasetId: string }>();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [detail, setDetail] = useState<DatasetDetail | null>(null);
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
    if (!user || !params.datasetId) return;
    apiFetch<DatasetDetail>(`/api/datasets/${params.datasetId}`)
      .then(setDetail)
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : "Could not load dataset.");
      });
  }, [user, params.datasetId]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/auth?mode=login");
  }

  const headers = detail?.columns.map((column) => column.name) ?? [];

  return (
    <AppShell user={user} active="datasets" onLogout={handleLogout}>
      <section className="dashboard-card panel">
        <div className="panel-header">
          <div>
            <h1 className="panel-title">{detail?.dataset.name ?? "Dataset"}</h1>
            <p className="panel-description">{detail?.dataset.description}</p>
          </div>
          {detail && (
            <button
              className="primary-btn small-btn"
              type="button"
              onClick={async () => {
                const response = await fetch(
                  `/api/datasets/${detail.dataset.id}/download`,
                  { credentials: "include" },
                );
                if (!response.ok) {
                  setError("Could not download CSV.");
                  return;
                }
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${detail.dataset.name.replace(/[^\w-]+/g, "_")}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download CSV
            </button>
          )}
        </div>

        {error && <p className="auth-error">{error}</p>}

        {detail && (
          <>
            <p className="welcome-sub">
              {detail.rows.length} of {detail.dataset.target_rows} requested rows currently available.
            </p>
            <div className="dataset-table-wrap">
              <table className="dataset-table">
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.rows.map((row) => (
                    <tr key={row.id}>
                      {headers.map((header) => (
                        <td key={header}>{String(row.data?.[header] ?? "")}</td>
                      ))}
                      <td>{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {detail.rows.length === 0 && (
                <p className="welcome-sub">No approved rows yet.</p>
              )}
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
