"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { SESSION_PERSON_KEY } from "@/lib/api";
import styles from "../page.module.css";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getFirstName(): string | null {
  const raw = sessionStorage.getItem(SESSION_PERSON_KEY);
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { first_name?: string }).first_name ?? null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const firstName = useSyncExternalStore(subscribe, getFirstName, () => null);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true">C</span>
            <span>CoffeeConnect</span>
          </Link>
          <p>Home</p>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.registration} aria-labelledby="home-heading">
          <h2 id="home-heading">{firstName ? `Welcome, ${firstName}` : "Welcome"}</h2>
          <p className={styles.registrationIntro}>
            Your CoffeeConnect home page is coming soon.
          </p>
        </section>
      </main>
    </div>
  );
}
