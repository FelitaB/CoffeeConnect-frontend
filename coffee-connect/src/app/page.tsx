import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true">C</span>
            <span>CoffeeConnect</span>
          </Link>
          <p>Internal desk booking dashboard</p>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.registration} aria-labelledby="home-heading">
          <h1 id="home-heading">CoffeeConnect</h1>
          <p className={styles.registrationIntro}>
            Welcome. Join us for your next coffee.
          </p>
          <nav className={styles.homeActions} aria-label="Account">
            <Link className={styles.submit} href="/sign-in">Sign in</Link>
            <Link className={styles.submit} href="/register">Register</Link>
          </nav>
        </section>
      </main>
    </div>
  );
}
