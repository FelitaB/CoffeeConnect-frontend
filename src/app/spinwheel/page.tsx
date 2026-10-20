"use client";

import Link from "next/link";
import { useEffect, useState, type TransitionEvent } from "react";
import { apiClient, SESSION_PERSON_KEY, type Person } from "@/lib/api";
import DemoAuthGate, { SignOutButton } from "../auth-gate";
import CompanyLogo from "../company-logo";
import styles from "../page.module.css";

type SpinPhase = "ready" | "loading" | "spinning" | "result" | "accepting" | "declining" | "empty" | "limit";

type SpinResponse = {
  match: Person | null;
};

type IncomingPendingMatch = {
  id: number;
  person: Person;
};

type OutgoingPendingMatch = {
  id: number;
  match: Person;
};

type PendingMatchesResponse = {
  incoming: IncomingPendingMatch[];
  outgoing: OutgoingPendingMatch[];
};

type AcceptOfferResponse = {
  match: { id: number };
};

async function requestPendingMatches(personId: number): Promise<PendingMatchesResponse> {
  const { data } = await apiClient.get<PendingMatchesResponse>(`/people/${personId}/matches/pending`);
  return data;
}

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

function getApiErrorStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

export default function SpinwheelPage() {
  const [phase, setPhase] = useState<SpinPhase>("ready");
  const [match, setMatch] = useState<Person | null>(null);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasSpun, setHasSpun] = useState(false);
  const [incomingMatches, setIncomingMatches] = useState<IncomingPendingMatch[]>([]);
  const [outgoingMatches, setOutgoingMatches] = useState<OutgoingPendingMatch[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");
  const [respondingMatchId, setRespondingMatchId] = useState<number | null>(null);

  useEffect(() => {
    const personId = getStoredPersonId();
    let cancelled = false;
    const pendingRequest = personId
      ? requestPendingMatches(personId)
      : Promise.reject(new Error("Your signed-in profile could not be found."));

    pendingRequest
      .then((data) => {
        if (!cancelled) {
          setIncomingMatches(data.incoming);
          setOutgoingMatches(data.outgoing);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setPendingError(personId
            ? getApiErrorMessage(requestError)
            : "Your signed-in profile could not be found. Please sign in again.");
        }
      })
      .finally(() => {
        if (!cancelled) setPendingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
    setHasSpun(true);
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
      if (getApiErrorStatus(requestError) === 429) {
        setError("");
        setPhase("limit");
        return;
      }
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

    if (!match) return;

    setError("");
    setPhase("accepting");
    try {
      const { data } = await apiClient.post<AcceptOfferResponse>(`/people/${personId}/spin/accept`);
      setOutgoingMatches((current) => [
        ...current.filter((pending) => pending.id !== data.match.id),
        { id: data.match.id, match },
      ]);
      setMatch(null);
      setPhase("ready");
      setNotice(`${match.first_name} is waiting to accept. You can spin again until you have two active matches.`);
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
      setHasSpun(true);
      setNotice("Match declined. You can spin again.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setPhase("result");
    }
  }

  async function respondToIncomingMatch(match: IncomingPendingMatch, decision: "accept" | "decline") {
    const personId = getStoredPersonId();
    if (!personId) {
      setPendingError("Your signed-in profile could not be found. Please sign in again.");
      return;
    }

    setPendingError("");
    setRespondingMatchId(match.id);
    try {
      await apiClient.post(`/people/${personId}/matches/${match.id}/${decision}`);
      setIncomingMatches((current) => current.filter((pending) => pending.id !== match.id));
      setNotice(decision === "accept"
        ? `You accepted ${match.person.first_name}'s match.`
        : `You declined ${match.person.first_name}'s match.`);
    } catch (requestError) {
      setPendingError(getApiErrorMessage(requestError));
    } finally {
      setRespondingMatchId(null);
    }
  }

  async function refreshPendingMatches() {
    const personId = getStoredPersonId();
    if (!personId) return;

    setPendingError("");
    setPendingLoading(true);
    try {
      const data = await requestPendingMatches(personId);
      setIncomingMatches(data.incoming);
      setOutgoingMatches(data.outgoing);
    } catch (requestError) {
      setPendingError(getApiErrorMessage(requestError));
    } finally {
      setPendingLoading(false);
    }
  }

  function handleWheelTransition(event: TransitionEvent<HTMLDivElement>) {
    if (event.propertyName === "transform" && phase === "spinning") {
      setPhase("result");
    }
  }

  const isBusy = phase === "loading" || phase === "spinning" || phase === "accepting" || phase === "declining";
  const showSpinControl = phase !== "result" && phase !== "accepting" && phase !== "declining" && phase !== "limit";

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

            {showSpinControl && (
              <div className={styles.spinWheelControls}>
                <button className={styles.submit} type="button" onClick={spin} disabled={isBusy}>
                  {phase === "loading" || phase === "spinning" ? "Spinning..." : hasSpun ? "Spin again" : "Spin the wheel"}
                </button>
              </div>
            )}

            {error && <p className={styles.warning} role="alert">{error}</p>}
            {notice && <p className={styles.status} role="status">{notice}</p>}
            {phase === "empty" && (
              <p className={styles.status} role="status">No eligible colleagues are available right now.</p>
            )}
            {phase === "limit" && (
              <p className={styles.status} role="status">You have reached the limit of two pending or accepted matches this week.</p>
            )}

            {(phase === "result" || phase === "accepting" || phase === "declining") && match && (
              <section className={styles.matchResult} aria-live="polite" aria-labelledby="match-heading">
                <p className={styles.matchEyebrow}>Your coffee match</p>
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

            <section className={styles.pendingMatchesSection} aria-labelledby="incoming-matches-heading">
              <div className={styles.pendingMatchesHeader}>
                <h2 id="incoming-matches-heading">Invitations for you</h2>
                <button className={styles.backLink} type="button" onClick={refreshPendingMatches} disabled={pendingLoading}>
                  {pendingLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              {pendingError && <p className={styles.warning} role="alert">{pendingError}</p>}
              {pendingLoading ? (
                <p className={styles.status} role="status">Loading pending matches...</p>
              ) : incomingMatches.length === 0 ? (
                <p className={styles.status}>No invitations are waiting for your response.</p>
              ) : (
                <ul className={styles.meetupList}>
                  {incomingMatches.map((invitation) => (
                    <li className={styles.meetupItem} key={invitation.id}>
                      <div>
                        <h3 className={styles.meetupName}>
                          Coffee invitation from {invitation.person.first_name} {invitation.person.last_name}
                        </h3>
                        <p className={styles.meetupMeta}>{invitation.person.location.toLowerCase()} office</p>
                      </div>
                      <div className={styles.matchActions}>
                        <button className={styles.submit} type="button" onClick={() => respondToIncomingMatch(invitation, "accept")} disabled={respondingMatchId !== null}>
                          {respondingMatchId === invitation.id ? "Responding..." : "Accept"}
                        </button>
                        <button className={styles.declineButton} type="button" onClick={() => respondToIncomingMatch(invitation, "decline")} disabled={respondingMatchId !== null}>
                          Decline
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.pendingMatchesSection} aria-labelledby="outgoing-matches-heading">
              <div className={styles.pendingMatchesHeader}>
                <h2 id="outgoing-matches-heading">Waiting for a response</h2>
              </div>
              {outgoingMatches.length === 0 ? (
                <p className={styles.status}>You have no matches waiting for a colleague.</p>
              ) : (
                <ul className={styles.meetupList}>
                  {outgoingMatches.map((pending) => (
                    <li className={styles.meetupItem} key={pending.id}>
                      <div>
                        <h3 className={styles.meetupName}>
                          {pending.match.first_name} {pending.match.last_name}
                        </h3>
                        <p className={styles.meetupMeta}>You accepted; waiting for their response.</p>
                      </div>
                      <span className={styles.meetupStatus}>pending</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Link className={styles.backLink} href="/meetups">Back to meetups</Link>
          </section>
        </main>
      </div>
    </DemoAuthGate>
  );
}