// components/NavBar.tsx
"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

const AUTH_ROUTES = ["/login", "/register"];

export function NavBar() {
  const { user, logout, isAdmin } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  // Don't show navbar on auth pages
  if (AUTH_ROUTES.includes(pathname)) return null;
  if (!user) return null;

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <nav className="navbar">
      <div className="navbar-brand">DCP</div>
      <div className="navbar-links">
        <a href="/connections" className={pathname === "/connections" ? "active" : ""}>Connections</a>
        <a href="/extract"    className={pathname === "/extract"    ? "active" : ""}>Extract</a>
        <a href="/files"      className={pathname === "/files"      ? "active" : ""}>Files</a>
      </div>
      <div className="navbar-user">
        <span className={`user-badge ${isAdmin ? "admin" : ""}`}>
          {isAdmin ? "admin" : "user"}
        </span>
        <span className="username">{user.username}</span>
        <button className="logout-btn" onClick={handleLogout}>Sign out</button>
      </div>

      <style>{`
        .navbar {
          display: flex; align-items: center; gap: 1.5rem;
          padding: 0.6rem 1.5rem; border-bottom: 1px solid #1e2128;
          background: #0d0f12; font-family: 'IBM Plex Mono', monospace;
        }
        .navbar-brand { font-size: 0.7rem; font-weight: 500; letter-spacing: 0.2em; color: #555b6a; }
        .navbar-links { display: flex; gap: 1.25rem; flex: 1; margin-left: 1rem; }
        .navbar-links a { font-size: 0.75rem; color: #555b6a; text-decoration: none; transition: color 0.15s; }
        .navbar-links a:hover, .navbar-links a.active { color: #e0e2e8; }
        .navbar-user { display: flex; align-items: center; gap: 0.75rem; margin-left: auto; }
        .user-badge { font-size: 0.62rem; padding: 1px 6px; border: 1px solid #1e2128; color: #555b6a; }
        .user-badge.admin { border-color: #336791; color: #4fa3d4; }
        .username { font-size: 0.75rem; color: #9aa0ae; }
        .logout-btn { background: none; border: 1px solid #1e2128; color: #555b6a; padding: 0.25rem 0.65rem; font-size: 0.7rem; font-family: 'IBM Plex Mono', monospace; cursor: pointer; transition: all 0.15s; }
        .logout-btn:hover { border-color: #e05c5c; color: #e05c5c; }
      `}</style>
    </nav>
  );
}