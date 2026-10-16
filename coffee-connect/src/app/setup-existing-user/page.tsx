import Link from "next/link";
import styles from "../page.module.css";

export default function SetupExistingUserPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true">C</span>
            <span>CoffeeConnect</span>
          </Link>
          <p>Set up your account</p>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.registration} aria-labelledby="setup-heading">
          <h2 id="setup-heading">Finish setting up your account</h2>
          <p className={styles.registrationIntro}>
            Account setup is coming soon.
          </p>
          <Link className={styles.backLink} href="/sign-in">Back to sign in</Link>
        </section>
      </main>
    </div>
  );
}
