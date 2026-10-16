import Link from "next/link";
import DemoAuthGate, { SignOutButton } from "../auth-gate";
import CompanyLogo from "../company-logo";
import styles from "../page.module.css";

type Meetup = {
  id: string;
  personName: string;
  location: "LONDON" | "MANCHESTER" | "BELFAST";
  datetime: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";
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
];

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
            <span>CoffeeConnect</span>
          </Link>
          <div className={styles.headerUtility}>
            <p>Your coffee meetups</p>
            <SignOutButton />
            <CompanyLogo />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.registration} aria-labelledby="meetups-heading">
          <h1 id="meetups-heading">My meetups</h1>
          <p className={styles.registrationIntro}>
            See who you’re meeting, and when and where.
          </p>
          <p className={styles.status} role="status">
            Demo data only. These meetups aren’t connected to your account.
          </p>

          <ul className={styles.meetupList}>
            {MOCK_MEETUPS.map((meetup) => (
              <li className={styles.meetupItem} key={meetup.id}>
                <div>
                  <h2 className={styles.meetupName}>
                    Coffee with {meetup.personName}
                  </h2>
                  <p className={styles.meetupMeta}>
                    {LOCATION_NAMES[meetup.location]} ·{" "}
                    <time dateTime={new Date(meetup.datetime * 1000).toISOString()}>
                      {formatDate(meetup.datetime)}
                    </time>
                  </p>
                </div>
                <span className={styles.meetupStatus}>
                  {meetup.status.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>

          <Link className={styles.backLink} href="/interests">Update interests</Link>
        </section>
      </main>
    </div>
  );
}