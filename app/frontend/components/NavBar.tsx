"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { nav } from "@/styles/components";

const AUTH_ROUTES = ["/login", "/register"];
const LINKS = ["/connections", "/extract", "/files", "/docs"] as const;

export function NavBar() {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (AUTH_ROUTES.includes(pathname) || !user) return null;

  const handleLogout = () => { logout(); router.push("/login"); };
  const label = (path: string) => path.slice(1).charAt(0).toUpperCase() + path.slice(2);

  return (
    <nav className={nav.bar}>
      <div className={nav.brand}>DCP</div>

      {/* Desktop links */}
      <div className={nav.links}>
        {LINKS.map((path) => (
          <a key={path} href={path} className={pathname === path ? nav.linkActive : nav.link}>
            {label(path)}
          </a>
        ))}
      </div>

      <div className={nav.user}>
        <span className={isAdmin ? nav.badgeAdmin : nav.badge}>
          {isAdmin ? "admin" : "user"}
        </span>
        <span className={nav.username}>{user.username}</span>
        <button className={nav.logout} onClick={handleLogout}>Sign out</button>

        {/* Hamburger */}
        <button className={nav.hamburger} onClick={() => setOpen(!open)} aria-label="Menu">
          <span className={open ? nav.hamburgerLineTop : nav.hamburgerLine} />
          <span className={open ? nav.hamburgerLineMid : nav.hamburgerLine} />
          <span className={open ? nav.hamburgerLineBot : nav.hamburgerLine} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className={nav.drawer}>
          {LINKS.map((path) => (
            <a key={path} href={path} className={pathname === path ? nav.drawerLinkActive : nav.drawerLink}
              onClick={() => setOpen(false)}>
              {label(path)}
            </a>
          ))}
          <div className={nav.drawerFooter}>
            <span className={isAdmin ? nav.badgeAdmin : nav.badge}>{isAdmin ? "admin" : "user"}</span>
            <span className={nav.username}>{user.username}</span>
            <button className={nav.logout} onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      )}
    </nav>
  );
}