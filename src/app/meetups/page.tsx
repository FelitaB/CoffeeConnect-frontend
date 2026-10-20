import Link from "next/link";
import DemoAuthGate, { SignOutButton } from "../auth-gate";
import CompanyLogo from "../company-logo";
import styles from "../page.module.css";
import { LOCATION_NAMES, PAST_MEETUPS, UPCOMING_MEETUPS, type Meetup } from "./constants";

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