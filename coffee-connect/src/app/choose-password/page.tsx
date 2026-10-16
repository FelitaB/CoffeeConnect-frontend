"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useSyncExternalStore } from "react";
import { getApiErrorMessage, SESSION_PENDING_EMAIL_KEY, setPassword, storePerson } from "@/lib/api";
import {
  describePasswordProblems,
  getPasswordProblems,
  PASSWORD_REQUIREMENTS,
} from "@/lib/password";
import styles from "../page.module.css";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export default function ChoosePasswordPage() {
  const router = useRouter();
  const email = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(SESSION_PENDING_EMAIL_KEY),
    () => null,
  );
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [warning, setWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWarning("");

    if (!email) return;

    const problems = getPasswordProblems(password);
    if (problems.length > 0) {
      setWarning(describePasswordProblems(problems));
      return;
    }
    if (password !== confirmPassword) {
      setWarning("The passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const person = await setPassword(email, password);
      storePerson(person);
      sessionStorage.removeItem(SESSION_PENDING_EMAIL_KEY);
      router.push("/interests");
    } catch (error) {
      setWarning(getApiErrorMessage(error, "Unable to reach CoffeeConnect right now. Please try again."));
      setSubmitting(false);
    }
  }

  function clearWarning() {
    setWarning("");
  }

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
        <section className={styles.registration} aria-labelledby="choose-password-heading">
          <h2 id="choose-password-heading">Choose a password</h2>
          {email ? (
            <>
              <p className={styles.registrationIntro}>
                Setting up CoffeeConnect for {email}
              </p>
              <form noValidate onSubmit={handleSubmit}>
                <input type="hidden" name="email" autoComplete="username" value={email} />
                <div className={styles.field}>
                  <label htmlFor="new-password">Password</label>
                  <input
                    id="new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    aria-describedby="password-requirements choose-password-warning"
                    value={password}
                    onChange={(event) => {
                      setPasswordValue(event.target.value);
                      clearWarning();
                    }}
                    autoFocus
                    required
                  />
                  <p className={styles.interestGuidance} id="password-requirements">
                    {PASSWORD_REQUIREMENTS}
                  </p>
                </div>
                <div className={styles.field}>
                  <label htmlFor="confirm-password">Confirm password</label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    aria-describedby="choose-password-warning"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearWarning();
                    }}
                    required
                  />
                </div>
                <label className={styles.interestOption} htmlFor="show-new-password">
                  <input
                    id="show-new-password"
                    type="checkbox"
                    checked={showPassword}
                    onChange={(event) => setShowPassword(event.target.checked)}
                  />
                  Show passwords
                </label>
                <p className={styles.warning} id="choose-password-warning" role="alert" hidden={!warning}>
                  {warning}
                </p>
                <button className={styles.submit} type="submit" disabled={submitting}>
                  {submitting ? "Please wait..." : "Continue to interests"}
                </button>
              </form>
            </>
          ) : (
            <p className={styles.registrationIntro}>
              Start by entering your work email on the sign-in page.
            </p>
          )}
          <Link className={styles.backLink} href="/sign-in">Back to sign in</Link>
        </section>
      </main>
    </div>
  );
}
