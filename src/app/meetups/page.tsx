"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredPerson, type Person } from "@/lib/api";
import { fetchMeetups, respondToMeetup, type Meetup, type MeetupAction } from "@/lib/meetups";
import DemoAuthGate from "../auth-gate";
import styles from "./meetups.module.css";
import pageStyles from "../page.module.css";

const LOCATIONS: Record<string, string> = {
  LONDON: "London", MANCHESTER: "Manchester", BELFAST: "Belfast",
};

function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return "Unable to reach CoffeeConnect. Please try again.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London",
  }).format(new Date(value));
}

function MeetupsContent() {
  const [person] = useState(() => getStoredPerson());
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (!person) return;
    const controller = new AbortController();
    fetchMeetups(person.id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setMeetups(data);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [person, loadAttempt]);

  function refresh() {
    setLoading(true);
    setLoadError("");
    setActionError("");
    setConfirmId(null);
    setLoadAttempt((attempt) => attempt + 1);
  }

  async function respond(meetup: Meetup, action: MeetupAction) {
    if (!person || busyId !== null) return;
    setBusyId(meetup.id);
    setActionError("");
    setNotice("");
    try {
      const result = await respondToMeetup(person.id, meetup.id, action);
      const completedAt = action === "complete" ? result.completed_at : meetup.completed_at;
      if (action === "complete" && !completedAt) throw new Error("Completion was not confirmed.");
      setMeetups((current) => action === "decline"
        ? current.filter((entry) => entry.id !== meetup.id)
        : current.map((entry) => entry.id !== meetup.id ? entry : {
          ...entry, status: "ACCEPTED", completed_at: completedAt ?? null,
        }));
      setConfirmId(null);
      const name = `${meetup.colleague.first_name} ${meetup.colleague.last_name}`;
      setNotice(action === "complete"
        ? `Your call with ${name} has been added to Past Meetups.`
        : action === "accept" ? `Match with ${name} accepted.` : `Match with ${name} declined.`);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  const upcoming = meetups.filter((meetup) => !meetup.completed_at);
  const past = meetups.filter((meetup) => meetup.completed_at)
    .sort((first, second) => Date.parse(second.completed_at!) - Date.parse(first.completed_at!) || second.id - first.id);
  const unavailable = !person || loading || Boolean(loadError);

  function renderCards(entries: Meetup[]) {
    return (
      <ul className={pageStyles.meetupCards}>
        {entries.map((meetup, index) => (
          <MeetupCard key={meetup.id} meetup={meetup} index={index} person={person!}
            disabled={busyId !== null || loading} busy={busyId === meetup.id} confirming={confirmId === meetup.id}
            onConfirm={() => { setActionError(""); setConfirmId(meetup.id); }} onCancel={() => setConfirmId(null)}
            onRespond={(action) => void respond(meetup, action)} />
        ))}
      </ul>
    );
  }

  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main-content">Skip to meetups</a>
      <main className={pageStyles.meetupsMain} id="main-content">
        <div className={pageStyles.meetupsIntro}>
          <p className={pageStyles.homeEyebrow}>MAKE TIME TO MEET</p>
          <div className={styles.titleRow}>
            <h1 id="meetups-heading">Your Meetups</h1>
            {person && <button className={styles.refresh} type="button" onClick={refresh} disabled={loading || busyId !== null}>{loading ? "Refreshing..." : "Refresh"}</button>}
          </div>
          <p>See who you’re meeting, and when and where.</p>
          <div className={styles.feedback}>
            {!person && <p role="alert">Your profile could not be found. <Link href="/sign-in?next=%2Fmeetups">Sign in again</Link>.</p>}
            {person && loading && <p role="status">Loading your meetups...</p>}
            {loadError && <div className={styles.error} role="alert"><p>{loadError}</p><button type="button" onClick={refresh}>Try again</button></div>}
            {actionError && <p className={styles.error} role="alert">{actionError} Refresh to check the latest match status.</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}
          </div>
        </div>
        <section className={pageStyles.meetupSection} aria-labelledby="upcoming-heading" aria-busy={loading && Boolean(person)}>
          <div className={pageStyles.meetupBandInner}>
            <div className={styles.sectionHeading}><h2 id="upcoming-heading">Upcoming</h2>{!unavailable && <span>{upcoming.length.toString().padStart(2, "0")}</span>}</div>
            {!unavailable && (upcoming.length ? renderCards(upcoming) : <div className={styles.empty}><h3>No upcoming meetups</h3><Link href="/spinwheel">Find your next coffee match</Link></div>)}
            {unavailable && <div className={styles.placeholder} aria-hidden="true" />}
          </div>
        </section>
        <section className={`${pageStyles.meetupSection} ${pageStyles.pastMeetupSection}`} aria-labelledby="past-heading" aria-busy={loading && Boolean(person)}>
          <div className={pageStyles.meetupBandInner}>
            <div className={styles.sectionHeading}><h2 id="past-heading">Past Meetups</h2>{!unavailable && <span>{past.length.toString().padStart(2, "0")}</span>}</div>
            {!unavailable && (past.length ? renderCards(past) : <div className={styles.empty}><h3>No completed calls yet</h3></div>)}
            {unavailable && <div className={styles.placeholder} aria-hidden="true" />}
          </div>
        </section>
      </main>
      <section className={pageStyles.meetupBanner} aria-label="Find your next coffee match">
        <div className={pageStyles.bannerInner}>
          <div><h2>Ready to meet someone new?</h2><p>Your next great conversation could be one spin away.</p></div>
          <Link href="/spinwheel">Spin the wheel</Link>
        </div>
      </section>
    </div>
  );
}
type MeetupCardProps = {
  meetup: Meetup;
  index: number;
  person: Person;
  disabled: boolean;
  busy: boolean;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onRespond: (action: MeetupAction) => void;
};

function MeetupCard({ meetup, index, person, disabled, busy, confirming, onConfirm, onCancel, onRespond }: MeetupCardProps) {
  const colleague = meetup.colleague;
  const completed = Boolean(meetup.completed_at);
  const accepted = meetup.status === "ACCEPTED";
  const shared = colleague.interests.filter((interest) => person.interests.some((own) => own.id === interest.id));
  const date = meetup.completed_at ?? meetup.matched_at;
  const fullName = `${colleague.first_name} ${colleague.last_name}`;
  const status = completed ? "Completed" : accepted ? "Ready to connect" : meetup.direction === "incoming" ? "Your response" : "Awaiting reply";

  return (
    <li className={styles.card}>
      <article aria-labelledby={`meetup-${meetup.id}-name`}>
        <div className={styles.cardTop}><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><span className={`${styles.status} ${completed || accepted ? styles.accepted : ""}`}>{status}</span></div>
        <div className={styles.avatar} aria-hidden="true">{colleague.first_name.slice(0, 1)}{colleague.last_name.slice(0, 1)}</div>
        <h3 id={`meetup-${meetup.id}-name`}>{fullName}</h3>
        <p className={styles.role}>{colleague.job_role} &middot; {colleague.job_capability}</p>
        <dl className={styles.details}>
          <div><dt>{completed ? "Completed on" : "Matched on"}</dt><dd><time dateTime={date}>{formatDate(date)}</time></dd></div>
          <div><dt>Location</dt><dd>{LOCATIONS[colleague.location] ?? colleague.location}</dd></div>
          <div><dt>Common interests</dt><dd>{shared.length ? shared.map((interest) => interest.name).join(", ") : "None shared yet"}</dd></div>
        </dl>
        <details className={styles.profileDetails}>
          <summary>Colleague details</summary>
          <p>{colleague.job_go_to_market}</p>
          <p>{colleague.interests.map((interest) => interest.name).join(", ") || "No interests listed"}</p>
          <a href={`mailto:${colleague.email}`}>{colleague.email}</a>
        </details>
        <div className={styles.contacts} aria-label={`Contact ${fullName}`}>
          <a href={`mailto:${colleague.email}`} aria-label={`Email ${fullName}`}>Email</a>
          <a href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(colleague.email)}`} target="_blank" rel="noopener noreferrer" aria-label={`Open Teams chat with ${fullName} (new tab)`}>Teams <span aria-hidden="true">&#8599;</span></a>
        </div>
        {!completed && <div className={styles.cardActions}>
          {accepted ? confirming ? (
            <div className={styles.confirmation}>
              <p>Has your call with {colleague.first_name} taken place?</p>
              <div><button className={styles.primaryButton} type="button" disabled={disabled} onClick={() => onRespond("complete")}>{busy ? "Saving..." : "Yes, mark completed"}</button><button className={styles.textButton} type="button" disabled={disabled} onClick={onCancel}>Cancel</button></div>
            </div>
          ) : <button className={styles.completeButton} type="button" disabled={disabled} onClick={onConfirm}>Mark as completed</button>
            : meetup.direction === "incoming" ? (
              <div className={styles.responseActions}><button className={styles.primaryButton} type="button" disabled={disabled} onClick={() => onRespond("accept")}>{busy ? "Saving..." : "Accept match"}</button><button className={styles.textButton} type="button" disabled={disabled} onClick={() => onRespond("decline")}>Decline</button></div>
            ) : <p className={styles.waiting}>Waiting for {colleague.first_name}</p>}
        </div>}
      </article>
    </li>
  );
}

export default function MeetupsPage() {
  return <DemoAuthGate returnTo="/meetups"><MeetupsContent /></DemoAuthGate>;
}
