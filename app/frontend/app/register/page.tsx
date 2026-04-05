// app/register/page.tsx
"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient, storeTokens } from "@/services/apiClient";
import type { AuthTokens, AuthUser } from "@/types";
import "../login/auth.css";

export default function RegisterPage() {
  const router                  = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const { data } = await apiClient.post<AuthTokens & { user: AuthUser }>(
        "/api/auth/register/",
        { username, email, password }
      );
      storeTokens({ access: data.access, refresh: data.refresh });
      router.push("/connections");
    } catch (err: unknown) {
      const detail = (err as { detail?: string })?.detail;
      setError(detail ?? "Registration failed. Username may already be taken.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">DCP</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Data Connector Platform</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <input className="auth-input" value={username}
              onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label className="auth-label">Email <span className="auth-optional">(optional)</span></label>
            <input className="auth-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password"
              autoComplete="new-password" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirm password</label>
            <input className="auth-input" type="password"
              autoComplete="new-password" value={confirm}
              onChange={e => setConfirm(e.target.value)} required />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p className="auth-switch">
          Have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}