"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { apiFetch, type AuthUser } from "../lib/api";

type ColumnRole = "input" | "label";
type DataType = "text" | "number" | "boolean" | "category";

type Column = {
  id: number;
  name: string;
  type: DataType;
  role: ColumnRole;
  categories: string;
};

export default function CreateDatasetPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [step, setStep] = useState(1);
  const [submitState, setSubmitState] = useState<"idle" | "creating" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const [dataset, setDataset] = useState({
    name: "",
    description: "",
    domain: "",
    purpose: "",
    target: 1000,
    visibility: "private",
  });

  const [columns, setColumns] = useState<Column[]>([
    { id: 1, name: "", type: "text", role: "input", categories: "" },
  ]);

  const [generation, setGeneration] = useState({
    humanRows: 1000,
    aiRows: 0,
    aiPrompt: "",
  });

  const [humanPrompts, setHumanPrompts] = useState<Record<number, string>>({});

  const [validation, setValidation] = useState({
    enabled: false,
    requiredValidators: 3,
    approvalPercentage: 67,
  });

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

  const totalGeneratedRows = Number(generation.humanRows) + Number(generation.aiRows);
  const inputColumns = columns.filter((column) => column.role === "input");
  const labelColumns = columns.filter((column) => column.role === "label");

  const getStepError = () => {
    if (step === 1) {
      if (!dataset.name.trim()) return "Enter a dataset name to continue.";
      if (!dataset.description.trim()) return "Add a dataset description to continue.";
      if (!dataset.domain.trim()) return "Enter a domain to continue.";
      if (!dataset.purpose.trim()) return "Enter the dataset purpose to continue.";
      if (!Number.isInteger(Number(dataset.target)) || Number(dataset.target) < 1) {
        return "Set a target of at least one row to continue.";
      }
    }

    if (step === 2) {
      if (columns.length === 0) return "Add at least one dataset column.";
      if (columns.some((column) => !column.name.trim())) {
        return "Name every column before continuing.";
      }
      if (
        columns.some(
          (column) =>
            (column.type === "category" || column.role === "label") &&
            !column.categories.trim(),
        )
      ) {
        return "Add allowed categories for each category or label column.";
      }
    }

    if (step === 3) {
      if (totalGeneratedRows !== Number(dataset.target) || Number(dataset.target) < 1) {
        return "Human-generated and AI-generated rows must add up to the target.";
      }
      if (generation.aiRows > 0 && !generation.aiPrompt.trim()) {
        return "Add an AI generation prompt or set AI-generated rows to zero.";
      }
      if (
        generation.humanRows > 0 &&
        columns.some((column) => !humanPrompts[column.id]?.trim())
      ) {
        return "Add a generation prompt for every input and label column.";
      }
    }

    if (step === 4 && validation.enabled) {
      if (!Number.isInteger(validation.requiredValidators) || validation.requiredValidators < 1) {
        return "Set at least one required validator.";
      }
      if (
        !Number.isInteger(validation.approvalPercentage) ||
        validation.approvalPercentage < 1 ||
        validation.approvalPercentage > 100
      ) {
        return "Set an approval threshold between 1% and 100%.";
      }
    }

    return null;
  };

  const stepError = getStepError();

  const updateColumn = (id: number, field: keyof Column, value: string) => {
    setColumns((current) =>
      current.map((column) => (column.id === id ? { ...column, [field]: value } : column)),
    );
  };

  const handleCreateDataset = async () => {
    setSubmitState("creating");
    setSubmitMessage("");

    try {
      const result = await apiFetch<{ message: string }>("/api/create_dataset", {
        method: "POST",
        body: JSON.stringify({
          dataset,
          columns: columns.map(({ id, name, type, role, categories }) => ({
            id,
            name,
            type,
            role,
            categories,
          })),
          generation,
          humanPrompts,
          validation: {
            enabled: validation.enabled,
            requiredValidators: validation.requiredValidators,
            approvalPercentage: validation.approvalPercentage,
          },
        }),
      });

      setSubmitState("success");
      setSubmitMessage(result.message || "Dataset successfully created");
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Failed to create dataset");
    }
  };

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/auth?mode=login");
  }

  return (
    <AppShell user={user} active="create" onLogout={handleLogout}>
      <div className="create-dataset-main">
        <section className="dashboard-card dashboard-welcome">
          <div className="welcome-row">
            <div>
              <p className="stat-label">Dataset creation · Step {step} of 5</p>
              <h1 className="welcome-title">
                {step === 1 && "Define your dataset"}
                {step === 2 && "Design your dataset schema"}
                {step === 3 && "Choose how data is generated"}
                {step === 4 && "Set up data validation"}
                {step === 5 && "Review your dataset"}
              </h1>
              <p className="welcome-sub">
                Build the structure and workflow that contributors and AI will use to create your dataset.
              </p>
            </div>
          </div>

          <div className="wizard-progress">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className={`wizard-step ${item <= step ? "active" : ""}`}>
                <div className="wizard-dot">{item}</div>
                <span>
                  {item === 1 && "Details"}
                  {item === 2 && "Schema"}
                  {item === 3 && "Generation"}
                  {item === 4 && "Validation"}
                  {item === 5 && "Review"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {step === 1 && (
          <section className="dashboard-card panel wizard-panel">
            <div className="form-grid">
              <div className="form-field full">
                <label>Dataset name</label>
                <input
                  value={dataset.name}
                  onChange={(e) => setDataset({ ...dataset, name: e.target.value })}
                />
              </div>
              <div className="form-field full">
                <label>Description</label>
                <textarea
                  rows={4}
                  value={dataset.description}
                  onChange={(e) => setDataset({ ...dataset, description: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Domain</label>
                <input
                  value={dataset.domain}
                  onChange={(e) => setDataset({ ...dataset, domain: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Purpose</label>
                <input
                  value={dataset.purpose}
                  onChange={(e) => setDataset({ ...dataset, purpose: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Target number of rows</label>
                <input
                  type="number"
                  min={1}
                  value={dataset.target}
                  onChange={(e) => {
                    const target = Math.max(1, Number(e.target.value));
                    setDataset({ ...dataset, target });
                    setGeneration({ ...generation, humanRows: target, aiRows: 0 });
                  }}
                />
              </div>
              <div className="form-field">
                <label>Visibility</label>
                <select
                  value={dataset.visibility}
                  onChange={(e) => setDataset({ ...dataset, visibility: e.target.value })}
                >
                  <option value="private">Private</option>
                  <option value="link_only">Anyone with link</option>
                  <option value="public">Public</option>
                  <option value="invite_only">Invite only</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="dashboard-card panel wizard-panel">
            <div className="panel-header">
              <h2 className="panel-title">Dataset columns</h2>
              <button
                type="button"
                className="ghost-btn"
                onClick={() =>
                  setColumns((current) => [
                    ...current,
                    { id: Date.now(), name: "", type: "text", role: "input", categories: "" },
                  ])
                }
              >
                + Add column
              </button>
            </div>
            <div className="schema-list">
              {columns.map((column, index) => (
                <div className="schema-card" key={column.id}>
                  <div className="schema-card-header">
                    <span className="schema-column-title">Column {index + 1}</span>
                    {columns.length > 1 && (
                      <button
                        type="button"
                        className="danger-text"
                        onClick={() =>
                          setColumns((current) => current.filter((item) => item.id !== column.id))
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Column name</label>
                      <input
                        value={column.name}
                        onChange={(e) => updateColumn(column.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Role</label>
                      <select
                        value={column.role}
                        onChange={(e) => {
                          const role = e.target.value as ColumnRole;
                          updateColumn(column.id, "role", role);
                          updateColumn(column.id, "type", role === "label" ? "category" : "text");
                        }}
                      >
                        <option value="input">Input</option>
                        <option value="label">Label</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Type</label>
                      <select
                        value={column.type}
                        onChange={(e) => updateColumn(column.id, "type", e.target.value)}
                        disabled={column.role === "label"}
                      >
                        <option value="text">text</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="category">category</option>
                      </select>
                    </div>
                    {(column.type === "category" || column.role === "label") && (
                      <div className="form-field full">
                        <label>Allowed categories</label>
                        <input
                          value={column.categories}
                          onChange={(e) => updateColumn(column.id, "categories", e.target.value)}
                          placeholder="billing, technical_support, refund"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="dashboard-card panel wizard-panel">
            <div className="generation-cards">
              <div className="generation-card active">
                <h3>Human generated</h3>
                <div className="form-field">
                  <label>Number of human-generated rows</label>
                  <input
                    type="number"
                    min={0}
                    max={dataset.target}
                    value={generation.humanRows}
                    onChange={(e) => {
                      const human = Math.max(0, Math.min(Number(e.target.value), Number(dataset.target)));
                      setGeneration({
                        ...generation,
                        humanRows: human,
                        aiRows: Number(dataset.target) - human,
                      });
                    }}
                  />
                </div>
              </div>
              <div className="generation-card active">
                <h3>AI generated</h3>
                <div className="form-field">
                  <label>Number of AI-generated rows</label>
                  <input
                    type="number"
                    min={0}
                    max={dataset.target}
                    value={generation.aiRows}
                    onChange={(e) => {
                      const ai = Math.max(0, Math.min(Number(e.target.value), Number(dataset.target)));
                      setGeneration({
                        ...generation,
                        aiRows: ai,
                        humanRows: Number(dataset.target) - ai,
                      });
                    }}
                  />
                </div>
                {generation.aiRows > 0 && (
                  <div className="form-field">
                    <label>Prompt for AI generation</label>
                    <textarea
                      rows={5}
                      value={generation.aiPrompt}
                      onChange={(e) => setGeneration({ ...generation, aiPrompt: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {generation.humanRows > 0 &&
              columns.map((column) => (
                <div className="prompt-card" key={column.id}>
                  <strong>{column.name || "Unnamed column"}</strong>
                  <div className="form-field">
                    <label>Generation prompt</label>
                    <textarea
                      rows={3}
                      value={humanPrompts[column.id] || ""}
                      onChange={(e) =>
                        setHumanPrompts({ ...humanPrompts, [column.id]: e.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
          </section>
        )}

        {step === 4 && (
          <section className="dashboard-card panel wizard-panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Threshold-based validation</h2>
                <p className="panel-description">
                  Validators answer YES or NO. No ranking and no custom validation prompts.
                </p>
              </div>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={validation.enabled}
                  onChange={(e) => setValidation({ ...validation, enabled: e.target.checked })}
                />
                <span>Validation: {validation.enabled ? "ON" : "OFF"}</span>
              </label>
            </div>

            {validation.enabled ? (
              <div className="form-grid">
                <div className="form-field">
                  <label>Required validators</label>
                  <input
                    type="number"
                    min={1}
                    value={validation.requiredValidators}
                    onChange={(e) =>
                      setValidation({
                        ...validation,
                        requiredValidators: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-field">
                  <label>Approval threshold</label>
                  <div className="percentage-input">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={validation.approvalPercentage}
                      onChange={(e) =>
                        setValidation({
                          ...validation,
                          approvalPercentage: Number(e.target.value),
                        })
                      }
                    />
                    <span>%</span>
                  </div>
                </div>
                <div className="form-field full">
                  <p className="panel-description">
                    {labelColumns.length > 0
                      ? "Validators will be asked: Does the output label correctly match the input?"
                      : "Validators will be asked: Is this submission valid/relevant?"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="empty-validation">
                <h3>No validation workflow</h3>
                <p>Generated rows will be approved and stored in the final dataset.</p>
              </div>
            )}
          </section>
        )}

        {step === 5 && (
          <section className="dashboard-card panel wizard-panel">
            <div className="review-grid">
              <div className="review-card">
                <span>Dataset</span>
                <strong>{dataset.name}</strong>
              </div>
              <div className="review-card">
                <span>Target rows</span>
                <strong>{dataset.target}</strong>
                <small>
                  Human {generation.humanRows} · AI {generation.aiRows}
                </small>
              </div>
              <div className="review-card">
                <span>Columns</span>
                <strong>{columns.length}</strong>
                <small>
                  {inputColumns.length} inputs · {labelColumns.length} labels
                </small>
              </div>
              <div className="review-card">
                <span>Validation</span>
                <strong>{validation.enabled ? "ON" : "OFF"}</strong>
                <small>
                  {validation.enabled
                    ? `${validation.requiredValidators} validators · ${validation.approvalPercentage}% threshold`
                    : "No additional validation"}
                </small>
              </div>
            </div>

            {submitState === "creating" && (
              <p className="wizard-required-note">Creating dataset...</p>
            )}
            {submitState === "success" && (
              <p className="wizard-required-note">{submitMessage}</p>
            )}
            {submitState === "error" && (
              <p className="auth-error" role="alert">{submitMessage}</p>
            )}
          </section>
        )}

        {step < 5 && stepError && (
          <p className="wizard-required-note" role="status">
            {stepError}
          </p>
        )}

        <div className="wizard-actions">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setStep((current) => Math.max(current - 1, 1))}
            disabled={step === 1 || submitState === "creating"}
          >
            Back
          </button>
          <div className="wizard-actions-right">
            {step < 5 ? (
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  if (!getStepError()) setStep((current) => Math.min(current + 1, 5));
                }}
                disabled={Boolean(stepError)}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                className="primary-btn"
                onClick={handleCreateDataset}
                disabled={submitState === "creating" || submitState === "success"}
              >
                {submitState === "creating" ? "Creating dataset..." : "Create Dataset"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
