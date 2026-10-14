"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [warning, setWarning] = useState("");
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWarning("");

    const form = event.currentTarget;
    const emailInput = form.querySelector<HTMLInputElement>("#email");
    const passwordInput = form.querySelector<HTMLInputElement>("#password");

    if (!emailInput || !passwordInput) {
      return;
    }

    emailInput.value = emailInput.value.trim();
    const validEmail =
      emailInput.validity.valid &&
      emailInput.value.toLowerCase().endsWith("@paconsulting.com");
    const validPassword = passwordInput.value.length >= 8;
    const messages: string[] = [];

    setEmailInvalid(!validEmail);
    setPasswordInvalid(!validPassword);

    if (!form.checkValidity()) {
      messages.push("Complete all required fields with valid values.");
    }
    if (!validEmail) {
      messages.push("Use a valid work email ending in @paconsulting.com.");
    }
    if (!validPassword) {
      messages.push("Your password must be at least eight characters long.");
    }

    if (messages.length > 0) {
      setWarning(messages.join(" "));
      if (!validEmail) {
        emailInput.focus();
      } else if (!validPassword) {
        passwordInput.focus();
      } else {
        form.querySelector<HTMLInputElement | HTMLSelectElement>(":invalid")?.focus();
      }
      return;
    }

    router.push("/interests");
  }

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
        <section className={styles.registration} aria-labelledby="registration-heading">
          <h2 id="registration-heading">Register</h2>
          <p className={styles.registrationIntro}>
            Create your profile to find colleagues with shared interests.
          </p>
          <form id="registration-form" noValidate onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="first-name">First name</label>
              <input id="first-name" name="firstName" autoComplete="given-name" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="last-name">Last name</label>
              <input id="last-name" name="lastName" autoComplete="family-name" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                aria-describedby="registration-warning"
                aria-invalid={emailInvalid || undefined}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="location">Location</label>
              <select id="location" name="location" defaultValue="" required>
                <option value="" disabled>Select your location</option>
                <option value="London">London Office</option>
                <option value="Manchester">Manchester Office</option>
                <option value="Belfast">Belfast Office</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                aria-describedby="registration-warning"
                aria-invalid={passwordInvalid || undefined}
                required
              />
            </div>
            <p
              className={styles.warning}
              id="registration-warning"
              role="alert"
              hidden={!warning}
            >
              {warning}
            </p>
            <button className={styles.submit} type="submit">
              Continue to interests
            </button>
          </form>
          <Link className={styles.backLink} href="/sign-in">Already have an account? Sign in</Link>
        </section>
      </main>
    </div>
  );
}