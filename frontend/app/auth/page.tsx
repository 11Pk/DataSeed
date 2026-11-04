"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  return (
    <Suspense fallback={<main className="auth-shell" aria-busy="true" />}>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() =>
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to authenticate. Please try again.");
      }

      router.replace("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to authenticate.");
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <main className="auth-shell">
      <header className="auth-topbar">
        <Link href="/" className="brand-wrap auth-brand">
          <span className="brand-logo" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">Dataseeds</span>
        </Link>
        <Link href="/" className="auth-home-link">Back to home</Link>
      </header>

      <div className="auth-stage">
        <section className="auth-copy">
          <p className="section-kicker">DATASEEDS COMMUNITY</p>
          <h1>{isSignup ? "Make better data, together." : "Good data starts here."}</h1>
          <p>
            {isSignup
              ? "Create an account to build datasets and contribute alongside the community."
              : "Sign in to pick up where your data work left off."}
          </p>
        </section>

        <section className="auth-panel" aria-labelledby="auth-heading">
          <div className="auth-mode-switch" role="group" aria-label="Account action">
            <button
              type="button"
              className={isSignup ? "auth-mode" : "auth-mode active"}
              onClick={() => { setMode("login"); setError(""); }}
              aria-pressed={!isSignup}
            >
              Sign in
            </button>
            <button
              type="button"
              className={isSignup ? "auth-mode active" : "auth-mode"}
              onClick={() => { setMode("signup"); setError(""); }}
              aria-pressed={isSignup}
            >
              Sign up
            </button>
          </div>

          <div className="auth-form-heading">
            <h2 id="auth-heading">{isSignup ? "Create your account" : "Welcome back"}</h2>
            <p>{isSignup ? "Start building with Dataseeds." : "Enter your details to continue."}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <label className="auth-field">
                <span>Name</span>
                <input name="name" type="text" autoComplete="name" required maxLength={100} />
              </label>
            )}
            <label className="auth-field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={isSignup ? 8 : undefined}
              />
            </label>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="primary-btn auth-submit" type="submit" disabled={busy}>
              {busy ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="auth-switch-copy">
            {isSignup ? "Already have an account?" : "New to Dataseeds?"}{" "}
            <button
              type="button"
              className="auth-inline-link"
              onClick={() => { setMode(isSignup ? "login" : "signup"); setError(""); }}
            >
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}
