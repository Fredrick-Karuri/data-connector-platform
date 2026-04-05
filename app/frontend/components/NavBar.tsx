"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { nav } from "@/styles/components";

const AUTH_ROUTES = ["/login", "/register"];

export function NavBar() {
  const { user, logout, isAdmin } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  if (AUTH_ROUTES.includes(pathname) || !user) return null;

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <nav className={nav.bar}>
      <div className={nav.brand}>DCP</div>
      <div className={nav.links}>
        {(["/connections", "/extract", "/files"] as const).map(path => (
          <a key={path} href={path} className={pathname === path ? nav.linkActive : nav.link}>
            {path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
          </a>
        ))}
      </div>
      <div className={nav.user}>
        <span className={isAdmin ? nav.badgeAdmin : nav.badge}>{isAdmin ? "admin" : "user"}</span>
        <span className={nav.username}>{user.username}</span>
        <button className={nav.logout} onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
  );
}