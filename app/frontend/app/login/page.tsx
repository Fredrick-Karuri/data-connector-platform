"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { s } from "@/styles/auth";

export default function LoginPage() {
  const { login }               = useAuth();
  const router                  = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      router.push("/connections");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logo}>DCP</div>
        <h1 className={s.title}>Sign in</h1>
        <p className={s.sub}>Data Connector Platform</p>

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Username</label>
            <input className={s.input} autoComplete="username"
              value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input type="password" className={s.input} autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className={s.error}>{error}</div>}
          <button className={s.btn} type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p className={s.switcher}>
          No account? <a href="/register" className={s.link}>Create one</a>
        </p>
      </div>
    </div>
  );
}