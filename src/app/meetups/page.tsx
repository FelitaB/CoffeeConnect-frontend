"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredPerson, type Person } from "@/lib/api";
import { acceptBookingTime, fetchMeetups, proposeBookingTimes, respondToMeetup, type Booking, type Meetup, type MeetupAction } from "@/lib/meetups";
import DemoAuthGate from "@/components/auth-gate";
import styles from "./meetups.module.css";
import pageStyles from "../page.module.css";

const LOCATIONS: Record<string, string> = {
  LONDON: "London", MANCHESTER: "Manchester", BELFAST: "Belfast",
};
const BOOKING_TIME_ZONE = "Europe/London";
const MAX_PROPOSED_SLOTS = 8;
const BOOKING_TIMES = Array.from({ length: 31 }, (_, index) => {
  const totalMinutes = 9 * 60 + index * 15;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
});

function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return "Unable to reach CoffeeConnect. Please try again.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: BOOKING_TIME_ZONE,
  }).format(new Date(value));
}

function getLondonDateKey(date: Date): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function londonSlotToIso(date: string, time: string): string | null {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (!year || !month || !day || hour === undefined || minute === undefined) return null;

  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23", timeZoneName: "longOffset",
  });
  let candidate = localAsUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map(({ type, value }) => [type, value]));
    const offset = parts.timeZoneName === "GMT" ? null : /GMT([+-])(\d{2}):(\d{2})/.exec(parts.timeZoneName ?? "");
    if (parts.timeZoneName !== "GMT" && !offset) return null;
    const offsetMinutes = offset ? (Number(offset[2]) * 60 + Number(offset[3])) * (offset[1] === "+" ? 1 : -1) : 0;
    const adjusted = localAsUtc - offsetMinutes * 60_000;
    if (adjusted === candidate) break;
    candidate = adjusted;
  }

  const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map(({ type, value }) => [type, value]));
  if (`${parts.year}-${parts.month}-${parts.day}` !== date || `${parts.hour}:${parts.minute}` !== time) return null;
  const startsAt = new Date(candidate);
  return startsAt.getTime() > Date.now() ? startsAt.toISOString() : null;
}

function formatBookingTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BOOKING_TIME_ZONE,
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(value));
}

export default function MeetupsPage() {
  return <DemoAuthGate returnTo="/meetups"><MeetupsContent /></DemoAuthGate>;
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
  const [bookingBusyId, setBookingBusyId] = useState<number | null>(null);
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

  async function saveBooking(meetup: Meetup, action: "propose" | "accept", value: string[] | number): Promise<Booking> {
    if (!person || bookingBusyId !== null) throw new Error("Please wait for the current booking update to finish.");
    setBookingBusyId(meetup.id);
    try {
      const booking = action === "propose"
        ? await proposeBookingTimes(person.id, meetup.id, value as string[])
        : await acceptBookingTime(person.id, meetup.id, value as number);
      setMeetups((current) => current.map((entry) => entry.id === meetup.id ? { ...entry, booking } : entry));
      return booking;
    } finally {
      setBookingBusyId(null);
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
            onRespond={(action) => void respond(meetup, action)}
            bookingBusy={bookingBusyId === meetup.id}
            onBookingPropose={(slots) => saveBooking(meetup, "propose", slots)}
            onBookingAccept={(slotId) => saveBooking(meetup, "accept", slotId)} />
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
  bookingBusy: boolean;
  onBookingPropose: (slots: string[]) => Promise<Booking>;
  onBookingAccept: (slotId: number) => Promise<Booking>;
};

function MeetupCard({ meetup, index, person, disabled, busy, confirming, onConfirm, onCancel, onRespond, bookingBusy, onBookingPropose, onBookingAccept }: MeetupCardProps) {
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
        {!completed && accepted && (
          <BookingPanel
            booking={meetup.booking}
            personId={person.id}
            colleagueName={fullName}
            disabled={bookingBusy || disabled}
            onPropose={onBookingPropose}
            onAccept={onBookingAccept}
          />
        )}
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

function BookingPanel({ booking, personId, colleagueName, disabled, onPropose, onAccept }: {
  booking: Booking | null;
  personId: number;
  colleagueName: string;
  disabled: boolean;
  onPropose: (slots: string[]) => Promise<Booking>;
  onAccept: (slotId: number) => Promise<Booking>;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getLondonDateKey(new Date()));
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dateError, setDateError] = useState("");
  const active = booking?.proposals.find((proposal) => proposal.status === "OPEN") ?? null;
  const awaitingColleague = Boolean(active && active.proposed_by === personId);
  const scheduledAt = booking?.status === "CONFIRMED" ? booking.scheduled_at : null;
  const selectedOption = active?.slots.find((slot) => slot.id === selectedSlotId) ?? active?.slots[0] ?? null;

  function toggleSlot(value: string) {
    setSelectedSlots((current) => current.includes(value)
      ? current.filter((slot) => slot !== value)
      : current.length < MAX_PROPOSED_SLOTS ? [...current, value] : current);
    setError("");
  }

  async function submitProposal() {
    if (!selectedSlots.length || saving) return;
    setSaving(true);
    setError("");
    try {
      await onPropose(selectedSlots);
      setSelectedSlots([]);
      setCalendarOpen(false);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function acceptSelectedSlot() {
    if (!selectedOption || saving) return;
    setSaving(true);
    setError("");
    try {
      await onAccept(selectedOption.id);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.booking} aria-label={`Book a coffee chat with ${colleagueName}`}>
      <h4>Book a time</h4>
      {scheduledAt ? (
        <p className={styles.bookingConfirmed}>Confirmed: <time dateTime={scheduledAt}>{formatBookingTime(scheduledAt)}</time> <span>(30 minutes)</span></p>
      ) : awaitingColleague && active ? (
        <>
          <p className={styles.bookingWaiting}>Your proposed times are with {colleagueName} for a response.</p>
          <ul className={styles.bookingChoices}>{active.slots.map((slot) => <li key={slot.id}>{formatBookingTime(slot.starts_at)}</li>)}</ul>
        </>
      ) : active ? (
        <>
          <fieldset className={styles.bookingFieldset}>
            <legend>{active.proposer.first_name} suggested these times</legend>
            {active.slots.map((slot) => (
              <label className={styles.bookingChoice} key={slot.id}>
                <input type="radio" name={`booking-slot-${booking?.id}`} checked={(selectedOption?.id ?? null) === slot.id} onChange={() => setSelectedSlotId(slot.id)} disabled={disabled || saving} />
                <span>{formatBookingTime(slot.starts_at)}</span>
                <span className={styles.bookingDuration}>30 min</span>
              </label>
            ))}
          </fieldset>
          <div className={styles.bookingActions}>
            <button className={styles.primaryButton} type="button" disabled={disabled || saving || !selectedOption} onClick={() => void acceptSelectedSlot()}>{saving ? "Saving..." : "Accept time"}</button>
            <button className={styles.textButton} type="button" disabled={disabled || saving} onClick={() => setCalendarOpen((open) => !open)}>{calendarOpen ? "Hide alternatives" : "Propose different times"}</button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.bookingWaiting}>Choose several times that work for you. The other person can accept one or suggest alternatives.</p>
          {!calendarOpen && <button className={styles.completeButton} type="button" disabled={disabled} onClick={() => setCalendarOpen(true)}>Propose times</button>}
        </>
      )}
      {calendarOpen && !scheduledAt && !awaitingColleague && (
        <div className={styles.bookingComposer}>
          <label className={styles.bookingDate}>
            <span>Choose a date</span>
            <input type="date" min={getLondonDateKey(new Date())} value={selectedDate} onChange={(event) => {
              const nextDate = event.target.value;
              if (!isLondonWeekday(nextDate)) {
                setDateError("Choose a weekday. Weekend bookings are not available.");
                return;
              }
              setDateError("");
              setSelectedDate(nextDate);
            }} disabled={disabled || saving} aria-describedby="booking-date-guidance" />
          </label>
          <p className={styles.bookingGuidance} id="booking-date-guidance">Weekdays only. 30-minute windows start every 15 minutes, 09:00–16:30 UK time. Availability is confirmed by the other person, not checked against a calendar.</p>
          {dateError && <p className={styles.error} role="alert">{dateError}</p>}
          <div className={styles.bookingTimes} role="group" aria-label="Available start times in UK time">
            {BOOKING_TIMES.map((time) => {
              const slot = londonSlotToIso(selectedDate, time);
              const selected = Boolean(slot && selectedSlots.includes(slot));
              const atLimit = selectedSlots.length >= MAX_PROPOSED_SLOTS;
              return (
                <button className={selected ? styles.bookingTimeSelected : styles.bookingTime} key={time} type="button" aria-pressed={selected} disabled={disabled || saving || !slot || (!selected && atLimit)} onClick={() => slot && toggleSlot(slot)}>{time}</button>
              );
            })}
          </div>
          <p className={styles.bookingCount} aria-live="polite">{selectedSlots.length} of {MAX_PROPOSED_SLOTS} options selected</p>
          {selectedSlots.length > 0 && <ul className={styles.selectedSlots}>{selectedSlots.map((slot) => <li key={slot}><span>{formatBookingTime(slot)}</span><button type="button" disabled={disabled || saving} aria-label={`Remove ${formatBookingTime(slot)}`} onClick={() => toggleSlot(slot)}>Remove</button></li>)}</ul>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.bookingActions}>
            <button className={styles.primaryButton} type="button" disabled={disabled || saving || selectedSlots.length === 0} onClick={() => void submitProposal()}>{saving ? "Sending..." : "Send time options"}</button>
            <button className={styles.textButton} type="button" disabled={saving} onClick={() => { setCalendarOpen(false); setError(""); }}>Cancel</button>
          </div>
        </div>
      )}
      {error && !calendarOpen && <p className={styles.error} role="alert">{error}</p>}
    </section>
  );
}

function isLondonWeekday(date: string): boolean {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return false;
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday !== 0 && weekday !== 6;
}
