import Link from "next/link";
import Image from "next/image";
import CompanyLogo from "./company-logo";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={`${styles.page} ${styles.homePage}`}>
      <header className={`${styles.header} ${styles.homeHeader}`}>
        <div className={styles.homeHeaderInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true">C</span>
            <span>Coffee<span className={styles.brandAccent}>Connect</span></span>
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
            <p className={styles.homeEyebrow}>PA CONSULTING · COFFEE CONNECT</p>
            <h1 id="home-heading">
              Good work starts with a <span>good conversation.</span>
            </h1>
            <p className={styles.homeLead}>
              Meet colleagues beyond your usual circle. Start with shared
              interests, then make time for a coffee.
            </p>
            <div className={styles.homeHeroActions}>
              <Link className={styles.homePrimaryAction} href="/register">
                Create your profile
              </Link>
              <Link className={styles.homeSecondaryAction} href="/meetups">
                Explore meetups
              </Link>
            </div>
            <p className={styles.homeSignInNote}>
              Already registered? <Link href="/sign-in">Sign in</Link>
            </p>
          </div>

          <figure className={styles.homeVisual}>
            <Image
              className={styles.homePhoto}
              src="/coffee-chat.jpg"
              alt="Coffee cups set out on a table in a bright cafe"
              width={1200}
              height={800}
              priority
              sizes="(max-width: 760px) 100vw, 50vw"
            />
            <figcaption className={styles.homePhotoCaption}>
              A little time. A different perspective.
            </figcaption>
          </figure>
        </section>

        <section className={styles.homeContent} aria-label="Get started">
          <article className={styles.nextChatPanel}>
            <div className={styles.nextChatCopy}>
              <p className={styles.homeEyebrow}>YOUR NEXT CHAT</p>
              <h2>Start with something in common.</h2>
              <p>
                Choose a few interests to get your Coffee Connect profile
                started. This prototype saves your choices in this browser only.
              </p>
            </div>
            <Link className={styles.nextChatAction} href="/interests">
              Choose your interests
            </Link>
          </article>

          <section className={styles.stepsPanel} id="how-it-works" aria-labelledby="steps-heading">
            <p className={styles.homeEyebrow}>A SIMPLE PLACE TO START</p>
            <h2 id="steps-heading">How Coffee Connect works</h2>
            <ol className={styles.homeSteps}>
              <li>
                <span className={styles.stepNumber}>01</span>
                <div>
                  <h3>Create your profile</h3>
                  <p>Tell us a little about yourself.</p>
                </div>
              </li>
              <li>
                <span className={styles.stepNumber}>02</span>
                <div>
                  <h3>Choose your interests</h3>
                  <p>Pick 3 to 10 things you enjoy.</p>
                </div>
              </li>
              <li>
                <span className={styles.stepNumber}>03</span>
                <div>
                  <h3>Explore meetups</h3>
                  <p>Find a reason to step away for coffee.</p>
                </div>
              </li>
            </ol>
          </section>
        </section>

        <section className={styles.meetupBanner} aria-labelledby="meetup-heading">
          <div>
            <p className={styles.homeEyebrow}>MAKE TIME TO MEET</p>
            <h2 id="meetup-heading">A good conversation belongs in your calendar.</h2>
            <p>Take a look at the Coffee Connect meetup board.</p>
          </div>
          <Link href="/meetups">View meetups</Link>
        </section>
      </main>

      <footer className={styles.homeFooter}>
        <span>Coffee Connect <span aria-hidden="true">·</span> PA Consulting</span>
        <span>Prototype preview · Meetups use sample data</span>
      </footer>
    </div>
  );
}
