import Link from "next/link";
import CompanyLogo from "./company-logo";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={`${styles.page} ${styles.homePage}`}>
      <header className={`${styles.header} ${styles.homeHeader}`}>
        <div className={styles.homeHeaderInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true">C</span>
            <span>Coffee <span className={styles.brandAccent}>Connect</span></span>
          </Link>
          <nav className={styles.homeNav} aria-label="Main navigation">
            <Link href="#how-it-works">How it works</Link>
            <Link href="/interests">Interests</Link>
            <Link href="/meetups">Meetups</Link>
          </nav>
          <div className={styles.homeHeaderActions}>
            <Link className={styles.homeSignIn} href="/sign-in">Sign in</Link>
            <Link className={styles.homeRegister} href="/register">Register</Link>
          </div>
          <CompanyLogo />
        </div>
      </header>

      <main className={`${styles.main} ${styles.homeMain}`} id="main-content">
        <section className={styles.homeHero} aria-labelledby="home-heading">
          <div className={styles.homeHeroCopy}>
            <p className={styles.homeEyebrow}>COFFEE CONNECT · PA CONSULTING</p>
            <h1 id="home-heading">Good coffee.<br />Great conversations.</h1>
            <p className={styles.homeLead}>
              Meet colleagues beyond your usual circle. Find common ground,
              then make time for a coffee.
            </p>
            <div className={styles.homeHeroActions}>
              <Link className={styles.homePrimaryAction} href="/spinwheel">
                Spin the wheel
              </Link>
              <Link className={styles.homeSecondaryAction} href="#how-it-works">
                See how it works
              </Link>
            </div>
          </div>

          <Link className={styles.homeWheelLink} href="/spinwheel" aria-label="Go to the coffee matching wheel">
            <span className={styles.homeWheelPointer} aria-hidden="true" />
            <span className={styles.homeWheel} aria-hidden="true">
              <span className={styles.homeWheelHub}>C</span>
            </span>
            <span className={styles.homeWheelCaption}>Your next great conversation</span>
          </Link>
        </section>

        <section className={styles.stepsPanel} id="how-it-works" aria-labelledby="steps-heading">
          <p className={styles.homeEyebrow}>A SIMPLE PLACE TO START</p>
          <h2 id="steps-heading">Three steps. One new connection.</h2>
          <p className={styles.stepsIntro}>Meet someone new, one cup at a time.</p>
          <ol className={styles.homeSteps}>
            <li>
              <span className={styles.stepIcon} aria-hidden="true">☕</span>
              <div>
                <h3>Spin the wheel</h3>
                <p>Find a colleague who shares your interests.</p>
              </div>
            </li>
            <li>
              <span className={styles.stepIcon} aria-hidden="true">✦</span>
              <div>
                <h3>Meet your match</h3>
                <p>See what you have in common.</p>
              </div>
            </li>
            <li>
              <span className={styles.stepIcon} aria-hidden="true">☕</span>
              <div>
                <h3>Grab a coffee</h3>
                <p>Arrange a meet-up and get to know someone new.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className={styles.meetupBanner} aria-labelledby="meetup-heading">
          <div>
            <h2 id="meetup-heading">Ready to meet someone new?</h2>
            <p>Your next great conversation could be one spin away.</p>
          </div>
          <Link href="/spinwheel">Spin the wheel</Link>
        </section>
      </main>

      <footer className={styles.homeFooter}>
        <span>Coffee Connect <span aria-hidden="true">·</span> PA Consulting</span>
        <span>Good conversations start over coffee.</span>
      </footer>
    </div>
  );
}
