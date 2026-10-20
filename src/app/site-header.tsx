"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useDemoSession } from "./auth-gate";
import CompanyLogo from "./company-logo";
import styles from "./site-header.module.css";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/interests", label: "Interests" },
  { href: "/meetups", label: "Meetups" },
  { href: "/spinwheel", label: "Spin the wheel" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const authorized = useDemoSession();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/" aria-label="Coffee Connect homepage">
          <span className={styles.brandMark} aria-hidden="true">C</span>
          <span>Coffee <span className={styles.brandAccent}>Connect</span></span>
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href || (href === "/" && pathname === "/home") ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          {authorized ? <SignOutButton /> : (
            <>
              <Link href="/sign-in" aria-current={pathname === "/sign-in" ? "page" : undefined}>Sign in</Link>
              <Link className={styles.register} href="/register" aria-current={pathname === "/register" ? "page" : undefined}>Register</Link>
            </>
          )}
        </div>
        <div className={styles.logo}><CompanyLogo /></div>
      </div>
    </header>
  );
}
