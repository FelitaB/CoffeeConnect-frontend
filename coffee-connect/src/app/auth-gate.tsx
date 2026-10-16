"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import styles from "./page.module.css";

export const DEMO_SESSION_KEY = "coffee-connect-demo-session";
const DEMO_SESSION_CHANGE_EVENT = "coffee-connect-demo-session-change";

function subscribeToDemoSession(onChange: () => void) {
  window.addEventListener(DEMO_SESSION_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(DEMO_SESSION_CHANGE_EVENT, onChange);
}

function getDemoSessionSnapshot() {
  return window.sessionStorage.getItem(DEMO_SESSION_KEY) === "active";
}

function getServerDemoSessionSnapshot() {
  return false;
}

export function startDemoSession() {
  window.sessionStorage.setItem(DEMO_SESSION_KEY, "active");
  window.dispatchEvent(new Event(DEMO_SESSION_CHANGE_EVENT));
}

type ProtectedPath = "/interests" | "/meetups";

type DemoAuthGateProps = {
  children: ReactNode;
  returnTo: ProtectedPath;
};

export default function DemoAuthGate({ children, returnTo }: DemoAuthGateProps) {
  const router = useRouter();
  const authorized = useSyncExternalStore(
    subscribeToDemoSession,
    getDemoSessionSnapshot,
    getServerDemoSessionSnapshot,
  );

  useEffect(() => {
    if (window.sessionStorage.getItem(DEMO_SESSION_KEY) !== "active") {
      router.replace(`/sign-in?next=${encodeURIComponent(returnTo)}`);
      return;
    }

  }, [returnTo, router]);

  if (!authorized) {
    return (
      <main className={styles.main}>
        <p className={styles.status} role="status">Checking sign-in...</p>
      </main>
    );
  }

  return children;
}

export function SignOutButton() {
  const router = useRouter();

  function signOut() {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
    window.dispatchEvent(new Event(DEMO_SESSION_CHANGE_EVENT));
    router.replace("/");
  }

  return (
    <button className={styles.signOutButton} type="button" onClick={signOut}>
      Sign out
    </button>
  );
}