"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton, useDemoSession } from "../auth-gate";
import CompanyLogo from "../company-logo";
import { NAV_LINKS } from "./constants";
import styles from "./site-header.module.css";

export default function SiteHeader() {
  const pathname = usePathname();
  const authorized = useDemoSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/" aria-label="Coffee Connect homepage">
          <span className={styles.brandMark} aria-hidden="true">C</span>
          <span>Coffee <span className={styles.brandAccent}>Connect</span></span>
        </Link>
        <nav
          id="main-navigation"
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}
          aria-label="Main navigation"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href || (href === "/" && pathname === "/home") ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className={`${styles.actions} ${authorized ? "" : styles.guestActions}`}>
          {authorized ? <SignOutButton /> : (
            <>
              <Link href="/sign-in" aria-current={pathname === "/sign-in" ? "page" : undefined}>Sign in</Link>
              <Link className={styles.register} href="/register" aria-current={pathname === "/register" ? "page" : undefined}>Register</Link>
            </>
          )}
        </div>
        <button
          className={styles.menuButton}
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className={styles.logo}><CompanyLogo /></div>
      </div>
    </header>
  );
}
