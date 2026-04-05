"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient, storeTokens } from "@/services/apiClient";
import type { AuthTokens, AuthUser } from "@/types";
import { s } from "@/styles/auth";

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
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logo}>DCP</div>
        <h1 className={s.title}>Create account</h1>
        <p className={s.sub}>Data Connector Platform</p>

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Username</label>
            <input className={s.input} value={username}
              onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className={s.field}>
            <label className={s.label}>
              Email <span className={s.optional}>(optional)</span>
            </label>
            <input className={s.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input className={s.input} type="password" autoComplete="new-password"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className={s.field}>
            <label className={s.label}>Confirm password</label>
            <input className={s.input} type="password" autoComplete="new-password"
              value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          {error && <div className={s.error}>{error}</div>}
          <button className={s.btn} type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p className={s.switcher}>
          Have an account? <a href="/login" className={s.link}>Sign in</a>
        </p>
      </div>
    </div>
  );
}