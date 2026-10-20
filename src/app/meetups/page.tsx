import Link from "next/link";
import DemoAuthGate from "../auth-gate";
import styles from "../page.module.css";
import { LOCATION_NAMES, PAST_MEETUPS, UPCOMING_MEETUPS, type Meetup } from "./constants";

function formatDate(datetime: number) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(datetime * 1000));
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

function MeetupsPageContent() {
  return (
    <>
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
          <div className={styles.meetupBandInner}>
            <h2 id="upcoming-heading">Upcoming</h2>
            <ul className={styles.meetupCards}>
              {UPCOMING_MEETUPS.map((meetup) => <MeetupCard key={meetup.id} meetup={meetup} />)}
            </ul>
          </div>
        </section>

        <section className={`${styles.meetupSection} ${styles.pastMeetupSection}`} aria-labelledby="past-heading">
          <div className={styles.meetupBandInner}>
            <h2 id="past-heading">Past Meetups</h2>
            <ul className={styles.meetupCards}>
              {PAST_MEETUPS.map((meetup) => <MeetupCard key={meetup.id} meetup={meetup} />)}
            </ul>
          </div>
        </section>

      </main>

      <section className={styles.meetupBanner} aria-label="Find your next coffee match">
        <div className={styles.bannerInner}>
          <div>
            <h2>Ready to meet someone new?</h2>
            <p>Your next great conversation could be one spin away.</p>
          </div>
          <Link href="/spinwheel">Spin the wheel</Link>
        </div>
      </section>
    </>
  );
}

export default function MeetupsPage() {
  return (
    <DemoAuthGate returnTo="/meetups">
      <MeetupsPageContent />
    </DemoAuthGate>
  );
}
