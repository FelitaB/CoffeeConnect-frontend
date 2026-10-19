"use client";

import Link from "next/link";
import { useEffect, useState, type TransitionEvent } from "react";
import { apiClient, SESSION_PERSON_KEY, type Person } from "@/lib/api";
import DemoAuthGate, { SignOutButton } from "../auth-gate";
import CompanyLogo from "../company-logo";
import styles from "../page.module.css";

type SpinPhase = "ready" | "loading" | "spinning" | "result" | "accepting" | "accepted" | "declining" | "empty";

type SpinResponse = {
  match: Person | null;
};

function getStoredPersonId(): number | null {
  const storedPerson = sessionStorage.getItem(SESSION_PERSON_KEY);
  if (!storedPerson) return null;

  try {
    const person = JSON.parse(storedPerson) as { id?: unknown };
    return typeof person.id === "number" ? person.id : null;
  } catch {
    return null;
  }
}

function getApiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return "CoffeeConnect couldn’t complete that request. Please try again.";
}

export default function SpinwheelPage() {
  const [phase, setPhase] = useState<SpinPhase>("ready");
  const [match, setMatch] = useState<Person | null>(null);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasDeclined, setHasDeclined] = useState(false);

  useEffect(() => {
    if (phase !== "spinning") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      setPhase((current) => current === "spinning" ? "result" : current);
    }, reducedMotion ? 50 : 4200);

    return () => window.clearTimeout(timer);
  }, [phase]);

  async function spin() {
    const personId = getStoredPersonId();
    if (!personId) {
      setError("Your signed-in profile could not be found. Please sign in again.");
      return;
    }

    setError("");
    setNotice("");
    setMatch(null);
    setPhase("loading");

    try {
      const { data } = await apiClient.post<SpinResponse>(`/people/${personId}/spin`);
      if (!data.match) {
        setPhase("empty");
        return;
      }

      setMatch(data.match);
      setPhase("spinning");
      setRotation((current) => current + 360 * 6 + Math.floor(Math.random() * 360));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setPhase("ready");
    }
  }

  async function acceptMatch() {
    const personId = getStoredPersonId();
    if (!personId) {
      setError("Your signed-in profile could not be found. Please sign in again.");
      return;
    }

    setError("");
    setPhase("accepting");
    try {
      await apiClient.post(`/people/${personId}/spin/accept`);
      setPhase("accepted");
      setNotice("Match accepted.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setPhase("result");
    }
  }

  async function declineMatch() {
    const personId = getStoredPersonId();
    if (!personId) {
      setError("Your signed-in profile could not be found. Please sign in again.");
      return;
    }

    setError("");
    setPhase("declining");
    try {
      await apiClient.post(`/people/${personId}/spin/decline`);
      setMatch(null);
      setPhase("ready");
      setHasDeclined(true);
      setNotice("Match declined. You can spin again.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setPhase("result");
    }
  }

  function handleWheelTransition(event: TransitionEvent<HTMLDivElement>) {
    if (event.propertyName === "transform" && phase === "spinning") {
      setPhase("result");
    }
  }

  const isBusy = phase === "loading" || phase === "spinning" || phase === "accepting" || phase === "declining";

  return (
    <DemoAuthGate returnTo="/spinwheel">
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link className={styles.brand} href="/">
              <span className={styles.brandMark} aria-hidden="true">C</span>
              <span>CoffeeConnect</span>
            </Link>
            <div className={styles.headerUtility}>
              <p>New CoffeeChat</p>
              <SignOutButton />
              <CompanyLogo />
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <section className={styles.registration} aria-labelledby="spinwheel-heading">
            <h1 id="spinwheel-heading">Spin the wheel</h1>
            <p className={styles.registrationIntro}>
              Find a colleague to share your next coffee with.
            </p>

            <div className={styles.spinWheelStage}>
              <span className={styles.spinWheelPointer} aria-hidden="true" />
              <div
                className={styles.spinWheel}
                style={{ transform: `rotate(${rotation}deg)` }}
                onTransitionEnd={handleWheelTransition}
                aria-hidden="true"
              >
                <span className={styles.spinWheelHub}>C</span>
              </div>
            </div>

            {phase !== "result" && phase !== "accepting" && phase !== "declining" && phase !== "accepted" && (
              <div className={styles.spinWheelControls}>
                <button className={styles.submit} type="button" onClick={spin} disabled={isBusy}>
                  {phase === "loading" || phase === "spinning" ? "Spinning..." : hasDeclined ? "Spin again" : "Spin the wheel"}
                </button>
              </div>
            )}

            {error && <p className={styles.warning} role="alert">{error}</p>}
            {notice && <p className={styles.status} role="status">{notice}</p>}
            {phase === "empty" && (
              <p className={styles.status} role="status">No eligible colleagues are available right now.</p>
            )}

            {(phase === "result" || phase === "accepting" || phase === "declining" || phase === "accepted") && match && (
              <section className={styles.matchResult} aria-live="polite" aria-labelledby="match-heading">
                <p className={styles.matchEyebrow}>{phase === "accepted" ? "Match accepted" : "Your coffee match"}</p>
                <h2 id="match-heading">{match.first_name} {match.last_name}</h2>
                <p className={styles.meetupMeta}>{match.location.toLowerCase()} office</p>
                {phase === "result" || phase === "accepting" || phase === "declining" ? (
                  <div className={styles.matchActions}>
                    <button className={styles.submit} type="button" onClick={acceptMatch} disabled={isBusy}>
                      {phase === "accepting" ? "Accepting..." : "Accept match"}
                    </button>
                    <button className={styles.declineButton} type="button" onClick={declineMatch} disabled={isBusy}>
                      {phase === "declining" ? "Declining..." : "Decline"}
                    </button>
                  </div>
                ) : null}
              </section>
            )}

            <Link className={styles.backLink} href="/meetups">Back to meetups</Link>
          </section>
        </main>
      </div>
    </DemoAuthGate>
  );
}