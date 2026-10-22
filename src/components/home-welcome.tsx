"use client";

import { useDemoSession } from "@/components/auth-gate";
import { getStoredPerson } from "@/lib/api";
import styles from "@/app/page.module.css";

export default function HomeWelcome() {
  const signedIn = useDemoSession();
  const firstName = signedIn ? getStoredPerson()?.first_name : null;

  if (!firstName) return null;

  return <p className={styles.homeLead}>Welcome, {firstName}</p>;
}
