"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AuthUser } from "./lib/api";

const steps = [
  {
    number: "01",
    icon: "☰",
    title: "Define your dataset",
    description:
      "Describe exactly what each row should contain. Set the schema, quality thresholds, and expected volume.",
  },
  {
    number: "02",
    icon: "✓",
    title: "Collect",
    description:
      "Contributors complete small, focused tasks to generate data. Each task is atomic and takes under two minutes.",
  },
  {
    number: "03",
    icon: "★",
    title: "Verify",
    description:
      "Other contributors classify, review, and vote on submissions. Bad data is flagged before it enters the dataset.",
  },
  {
    number: "04",
    icon: "↓",
    title: "Export",
    description:
      "Download your verified, clean dataset as CSV, JSON, or JSONL. Ready for fine-tuning, evaluation, or RAG.",
  },
];

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (data?.user) setUser(data.user as AuthUser);
      })
      .catch(() => undefined);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link href="/" className="brand-wrap">
          <div className="brand-logo" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <span className="brand-name">Dataseeds</span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <Link href="#how-it-works">How it works</Link>
          {user ? <Link href="/dashboard">Dashboard</Link> : null}
          <Link href={user ? "/contribute" : "/auth?mode=login"}>Contribute</Link>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-name">{user.name}</span>
              <Link href="/dashboard" className="ghost-btn">
                Dashboard
              </Link>
              <button className="ghost-btn" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth?mode=login" className="ghost-btn">
                Sign In
              </Link>
              <Link href="/auth?mode=signup" className="primary-btn small-btn">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="hero-section">
        <h1 className="hero-title">
          Build the dataset <span className="accent-text">your AI</span>
          <span className="hero-inline-block">project</span>
          <span className="hero-last-line">needs — together.</span>
        </h1>

        <p className="hero-copy">
          Define what you need. Let contributors generate and verify the data. Build
          high-quality datasets from scratch.
        </p>

        <div className="hero-actions">
          <Link
            href={user ? "/create_dataset" : "/auth?mode=login"}
            className="primary-btn large-btn"
          >
            Create a Dataset →
          </Link>
          <Link
            href={user ? "/contribute" : "/auth?mode=login"}
            className="secondary-btn"
          >
            Start Contributing
          </Link>
        </div>
      </section>

      <section className="steps-section" id="how-it-works">
        <p className="section-kicker">HOW IT WORKS</p>
        <h2>Four steps to a clean dataset</h2>

        <div className="steps-grid">
          {steps.map((step) => (
            <article key={step.title} className="step-card">
              <div className="step-header">
                <div className="step-icon-box">{step.icon}</div>
                <span className="step-number">{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>
          Ready to build <span className="accent-text">better</span> data?
        </h2>
        <p>
          Join 2,400+ teams who use Dataseeds to create the datasets their AI
          projects actually need.
        </p>

        <div className="hero-actions">
          <Link
            href={user ? "/create_dataset" : "/auth?mode=login"}
            className="primary-btn large-btn"
          >
            Create a Dataset →
          </Link>
          <Link
            href={user ? "/contribute" : "/auth?mode=login"}
            className="secondary-btn"
          >
            Start Contributing
          </Link>
        </div>
      </section>

      <footer className="page-footer">
        <div className="footer-brand">
          <div className="brand-logo small" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <span>Dataseeds — © 2026</span>
        </div>
      </footer>
    </main>
  );
}
