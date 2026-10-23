import Link from "next/link";
import HomeWelcome from "@/components/home-welcome";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.homePage}>
      <main className={`${styles.main} ${styles.homeMain}`} id="main-content">
        <section className={styles.homeHero} aria-labelledby="home-heading">
          <div className={styles.homeHeroCopy}>
            <p className={styles.homeEyebrow}>COFFEE CONNECT · PA CONSULTING</p>
            <HomeWelcome />
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
          <div className={styles.stepsInner}>
            <p className={styles.homeEyebrow}>A SIMPLE PLACE TO START</p>
            <h2 id="steps-heading">Three steps. One new connection.</h2>
            <p className={styles.stepsIntro}>Meet someone new, one cup at a time.</p>
            <ol className={styles.homeSteps}>
              <li>
                <div className={styles.stepVisual}>
                  <span className={styles.stepNumber}>1.</span>
                  <span className={styles.stepIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M5 7h5V2M19 17h-5v5" />
                      <path d="M6.5 17.5A8 8 0 0 0 20 12M17.5 6.5A8 8 0 0 0 4 12" />
                    </svg>
                  </span>
                </div>
                <div>
                  <h3>Spin the wheel</h3>
                  <p>Find a colleague who shares your interests.</p>
                </div>
              </li>
              <li>
                <div className={styles.stepVisual}>
                  <span className={styles.stepNumber}>2.</span>
                  <span className={styles.stepIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="9" cy="8" r="3" />
                      <path d="M3.5 20v-1.5a5.5 5.5 0 0 1 11 0V20" />
                      <path d="m15 11 2 2 4-4" />
                    </svg>
                  </span>
                </div>
                <div>
                  <h3>Meet your match</h3>
                  <p>See what you have in common.</p>
                </div>
              </li>
              <li>
                <div className={styles.stepVisual}>
                  <span className={styles.stepNumber}>3.</span>
                  <span className={styles.stepIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M5 8h12v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
                      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 4c0 1 1 1 1 2M12 3c0 1 1 1 1 2" />
                    </svg>
                  </span>
                </div>
                <div>
                  <h3>Grab a coffee</h3>
                  <p>Arrange a meet-up and get to know someone new.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

      </main>

      <section className={styles.meetupBanner} aria-labelledby="meetup-heading">
        <div className={styles.bannerInner}>
          <div>
            <h2 id="meetup-heading">Ready to meet someone new?</h2>
            <p>Your next great conversation could be one spin away.</p>
          </div>
          <Link href="/spinwheel">Spin the wheel</Link>
        </div>
      </section>

      <footer className={styles.homeFooter}>
        <span>Coffee Connect <span aria-hidden="true">·</span> PA Consulting</span>
        <span>Good conversations start over coffee.</span>
      </footer>
    </div>
  );
}
