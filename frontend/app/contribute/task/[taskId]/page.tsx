"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "../../../components/AppShell";
import { apiFetch, type AuthUser } from "../../../lib/api";

type Column = {
  id: string;
  name: string;
  type: string;
  role: string;
  categories: string[];
};

type TaskPayload = {
  task: {
    id: string;
    title: string;
    description: string;
    task_type: string;
    dataset_name: string;
  };
  columns: Column[];
  submission: { data: Record<string, unknown> } | null;
  labelled: boolean;
};

function renderField(
  column: Column,
  value: string,
  onChange: (value: string) => void,
  fieldId: string,
) {
  if (column.type === "category" || column.role === "label") {
    return (
      <div className="mcq-options" role="group" aria-labelledby={`${fieldId}-label`}>
        {column.categories.map((category, index) => (
          <label key={category} className={`mcq-option ${value === category ? "selected" : ""}`}>
            <input
              id={`${fieldId}-${index}`}
              type="radio"
              name={column.name}
              value={category}
              checked={value === category}
              onChange={() => onChange(category)}
            />
            <span>{category}</span>
          </label>
        ))}
      </div>
    );
  }

  if (column.type === "boolean") {
    return (
      <select id={fieldId} aria-labelledby={`${fieldId}-label`} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  if (column.type === "number") {
    return (
      <input
        id={fieldId}
        aria-labelledby={`${fieldId}-label`}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <textarea
      id={fieldId}
      aria-labelledby={`${fieldId}-label`}
      rows={4}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default function TaskPage() {
  const router = useRouter();
  const params = useParams<{ taskId: string }>();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [payload, setPayload] = useState<TaskPayload | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [decision, setDecision] = useState<"yes" | "no" | "">("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (!user || !params.taskId) return;
    apiFetch<TaskPayload>(`/api/tasks/${params.taskId}`)
      .then((data) => {
        setPayload(data);
        const next: Record<string, string> = {};
        data.columns.forEach((column) => {
          next[column.name] = "";
        });
        setValues(next);
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : "Could not load task.");
      });
  }, [user, params.taskId]);

  const submissionData = useMemo(() => {
    const raw = payload?.submission?.data;
    if (!raw) return {};
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return {};
      }
    }
    return raw;
  }, [payload]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/auth?mode=login");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!payload) return;
    setSubmitting(true);
    setError("");
    setStatus("");

    try {
      if (payload.task.task_type === "validation") {
        if (!decision) {
          throw new Error("Choose YES or NO.");
        }
        await apiFetch("/api/validation", {
          method: "POST",
          body: JSON.stringify({
            taskId: payload.task.id,
            decision,
          }),
        });
        setStatus("Validation submitted.");
      } else {
        await apiFetch("/api/contribute", {
          method: "POST",
          body: JSON.stringify({
            taskId: payload.task.id,
            data: values,
          }),
        });
        setStatus("Task submitted.");
      }
      setTimeout(() => router.push("/contribute"), 800);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell user={user} active="contribute" onLogout={handleLogout}>
      <div className="contribution-task">
        <Link href="/contribute" className="task-back-link">
          <span aria-hidden="true">←</span> Back to tasks
        </Link>

        <header className="task-heading">
          <div>
            <p className="task-kicker">
              {payload?.task.task_type === "validation" ? "Validation task" : "Contribution task"}
            </p>
            <h1>{payload?.task.title ?? "Task workspace"}</h1>
            <p className="task-dataset-name">{payload?.task.dataset_name ?? "Loading dataset..."}</p>
          </div>
          {payload && (
            <span className="task-type-badge">
              {payload.task.task_type === "validation" ? "Review" : "Generate a row"}
            </span>
          )}
        </header>

        {error && <p className="task-alert" role="alert">{error}</p>}
        {status && <p className="task-status" role="status">{status}</p>}

        {!payload ? (
          <section className="dashboard-card task-loading" aria-live="polite">
            {error ? "This task could not be loaded." : "Loading task..."}
          </section>
        ) : (
          <>
            {(payload.task.description?.trim() || payload.task.task_type === "human_generation") && (
              <section className="dashboard-card task-instructions">
                <div className="task-section-heading">
                  <span className="task-section-mark" aria-hidden="true">01</span>
                  <div>
                    <p className="task-kicker">From the dataset creator</p>
                    <h2>Task instructions</h2>
                  </div>
                </div>
                <p className="task-prompt-copy">
                  {payload.task.description?.trim() || "No custom instructions were added for this task."}
                </p>
              </section>
            )}

            <div className="task-workspace">
              <form className="dashboard-card task-panel task-form" onSubmit={handleSubmit}>
                <div className="task-section-heading task-panel-heading">
                  <span className="task-section-mark" aria-hidden="true">02</span>
                  <div>
                    <p className="task-kicker">{payload.task.task_type === "validation" ? "Review submission" : "Your response"}</p>
                    <h2>{payload.task.task_type === "validation" ? "Check this row" : "Complete the row"}</h2>
                  </div>
                  <span className="task-field-count">
                    {payload.task.task_type === "validation" ? "1 decision" : `${payload.columns.length} fields`}
                  </span>
                </div>

                {payload.task.task_type === "validation" ? (
                  <>
                    <div className="task-review-list">
                      {payload.columns.map((column) => (
                        <div className="task-review-row" key={column.id}>
                          <span>{column.name}</span>
                          <strong>{String(submissionData[column.name] ?? "") || "—"}</strong>
                        </div>
                      ))}
                    </div>
                    <fieldset className="task-decision-group">
                      <legend>
                        {payload.labelled
                          ? "Does the output label correctly match the input?"
                          : "Is this submission valid and relevant?"}
                      </legend>
                      <div className="task-decision-options">
                        <button
                          type="button"
                          aria-pressed={decision === "yes"}
                          className={`task-decision ${decision === "yes" ? "selected" : ""}`}
                          onClick={() => setDecision("yes")}
                        >
                          <span aria-hidden="true">✓</span> Yes
                        </button>
                        <button
                          type="button"
                          aria-pressed={decision === "no"}
                          className={`task-decision ${decision === "no" ? "selected" : ""}`}
                          onClick={() => setDecision("no")}
                        >
                          <span aria-hidden="true">×</span> No
                        </button>
                      </div>
                    </fieldset>
                  </>
                ) : (
                  <div className="task-fields">
                    {payload.columns.map((column) => (
                      <div className="form-field task-field" key={column.id}>
                        <div className="task-field-label" id={`task-field-${column.id}-label`}>
                          <span>{column.name}</span>
                          <small>{column.role === "label" ? "Label" : "Input"}</small>
                        </div>
                        {renderField(
                          column,
                          values[column.name] || "",
                          (value) => setValues((current) => ({ ...current, [column.name]: value })),
                          `task-field-${column.id}`,
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="task-submit-row">
                  <span>Changes are saved when you submit.</span>
                  <button className="primary-btn task-submit-btn" type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : payload.task.task_type === "validation" ? "Submit review" : "Submit contribution"}
                  </button>
                </div>
              </form>

              <aside className="dashboard-card task-schema-panel">
                <div className="task-schema-heading">
                  <p className="task-kicker">Reference</p>
                  <h2>Dataset schema</h2>
                </div>
                <p className="task-schema-description">Use these fields to shape your response.</p>
                <div className="task-schema-list">
                  {payload.columns.map((column, index) => (
                    <div className="task-schema-item" key={column.id}>
                      <span className="task-schema-index">{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{column.name}</strong>
                        <span>{column.type} · {column.role}</span>
                        {column.categories.length > 0 && (
                          <small>{column.categories.join(", ")}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
