import Link from "next/link";
import DemoAuthGate, { SignOutButton } from "../auth-gate";
import CompanyLogo from "../company-logo";
import styles from "../page.module.css";

type Meetup = {
  id: string;
  personName: string;
  location: "LONDON" | "MANCHESTER" | "BELFAST";
  datetime: number;
  status: "PENDING" | "ACCEPTED" | "COMPLETED";
};

const LOCATION_NAMES: Record<Meetup["location"], string> = {
  LONDON: "London Office",
  MANCHESTER: "Manchester Office",
  BELFAST: "Belfast Office",
};

const MOCK_MEETUPS: Meetup[] = [
  {
    id: "meetup-1",
    personName: "Amelia Khan",
    location: "LONDON",
    datetime: Date.UTC(2026, 9, 20, 10, 30) / 1000,
    status: "ACCEPTED",
  },
  {
    id: "meetup-2",
    personName: "Daniel Murphy",
    location: "BELFAST",
    datetime: Date.UTC(2026, 9, 22, 13, 0) / 1000,
    status: "PENDING",
  },
  {
    id: "meetup-3",
    personName: "Oliver Bennett",
    location: "MANCHESTER",
    datetime: Date.UTC(2026, 9, 26, 11, 0) / 1000,
    status: "ACCEPTED",
  },
  {
    id: "meetup-4",
    personName: "Priya Shah",
    location: "LONDON",
    datetime: Date.UTC(2026, 9, 8, 9, 30) / 1000,
    status: "COMPLETED",
  },
  {
    id: "meetup-5",
    personName: "Ethan Williams",
    location: "BELFAST",
    datetime: Date.UTC(2026, 9, 12, 14, 0) / 1000,
    status: "COMPLETED",
  },
  {
    id: "meetup-6",
    personName: "Sofia Patel",
    location: "MANCHESTER",
    datetime: Date.UTC(2026, 9, 15, 11, 30) / 1000,
    status: "COMPLETED",
  },
];

const UPCOMING_MEETUPS = MOCK_MEETUPS.filter((meetup) => meetup.status !== "COMPLETED");
const PAST_MEETUPS = MOCK_MEETUPS.filter((meetup) => meetup.status === "COMPLETED");

function formatDate(datetime: number) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(datetime * 1000));
}

export default function MeetupsPage() {
  return (
    <DemoAuthGate returnTo="/meetups">
      <MeetupsPageContent />
    </DemoAuthGate>
  );
}

function MeetupsPageContent() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true">C</span>
            <span>Coffee <span className={styles.brandAccent}>Connect</span></span>
          </Link>
          <nav className={styles.homeNav} aria-label="Main navigation">
            <Link href="/interests">Interests</Link>
            <Link href="/meetups" aria-current="page">Meetups</Link>
          </nav>
          <div className={styles.headerUtility}>
            <SignOutButton />
            <Link className={styles.headerHomeLink} href="/">Back to homepage</Link>
            <CompanyLogo />
          </div>
        </div>
      </header>

      <main className={`${styles.main} ${styles.meetupsMain}`}>
        <div className={styles.meetupsIntro}>
          <p className={styles.homeEyebrow}>MAKE TIME TO MEET</p>
          <h1 id="meetups-heading">Your Meetups</h1>
          <p>See who you’re meeting, and when and where.</p>
          <p className={styles.status} role="status">
            Demo data only. These meetups aren’t connected to your account.
          </p>
          <Link className={styles.newCoffeeChatButton} href="/spinwheel">
            Find a coffee match
          </Link>
        </div>

        <section className={styles.meetupSection} aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading">Upcoming</h2>
          <ul className={styles.meetupCards}>
            {UPCOMING_MEETUPS.map((meetup) => <MeetupCard key={meetup.id} meetup={meetup} />)}
          </ul>
        </section>

        <section className={`${styles.meetupSection} ${styles.pastMeetupSection}`} aria-labelledby="past-heading">
          <h2 id="past-heading">Past Meetups</h2>
          <ul className={styles.meetupCards}>
            {PAST_MEETUPS.map((meetup) => <MeetupCard key={meetup.id} meetup={meetup} />)}
          </ul>
        </section>

        <section className={styles.meetupBanner} aria-label="Find your next coffee match">
          <div>
            <h2>Ready to meet someone new?</h2>
            <p>Your next great conversation could be one spin away.</p>
          </div>
          <Link href="/spinwheel">Spin the wheel</Link>
        </section>
      </main>
    </div>
  );
}

function MeetupCard({ meetup }: { meetup: Meetup }) {
  return (
    <li className={styles.meetupCard}>
      <span className={styles.meetupCardDot} aria-hidden="true" />
      <h3>{meetup.personName}</h3>
      <p>{formatDate(meetup.datetime)}</p>
      <p>{LOCATION_NAMES[meetup.location]}</p>
      <span className={styles.meetupCardStatus}>{meetup.status.toLowerCase()}</span>
    </li>
  );
}