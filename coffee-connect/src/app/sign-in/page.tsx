"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import CompanyLogo from "../company-logo";
import styles from "../page.module.css";

export default function SignInPage() {
  const router = useRouter();
  const [warning, setWarning] = useState("");
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWarning("");

    const form = event.currentTarget;
    const emailInput = form.querySelector<HTMLInputElement>("#sign-in-email");
    const passwordInput = form.querySelector<HTMLInputElement>("#sign-in-password");

    if (!emailInput || !passwordInput) {
      return;
    }

    emailInput.value = emailInput.value.trim();
    const validEmail =
      emailInput.validity.valid &&
      emailInput.value.toLowerCase().endsWith("@paconsulting.com");
    const validPassword = passwordInput.value.length > 0;
    const messages: string[] = [];

    setEmailInvalid(!validEmail);
    setPasswordInvalid(!validPassword);

    if (!validEmail) {
      messages.push("Use a valid work email ending in @paconsulting.com.");
    }
    if (!validPassword) {
      messages.push("Enter your password.");
    }

    if (messages.length > 0) {
      setWarning(messages.join(" "));
      if (!validEmail) {
        emailInput.focus();
      } else {
        passwordInput.focus();
      }
      return;
    }

    passwordInput.value = "";
    setShowPassword(false);
    router.push("/meetups");
  }

  function clearFeedback() {
    setWarning("");
    setEmailInvalid(false);
    setPasswordInvalid(false);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true">C</span>
            <span>CoffeeConnect</span>
          </Link>
          <div className={styles.headerUtility}>
            <p>Internal desk booking dashboard</p>
            <CompanyLogo />
          </div>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.registration} aria-labelledby="sign-in-heading">
          <h2 id="sign-in-heading">Sign in</h2>
          <p className={styles.registrationIntro}>
            Welcome back to CoffeeConnect.
          </p>
          <p className={styles.status} role="status">
            Demo only: sign-in is not connected. A valid work email and non-empty password will open the sample meetups.
          </p>
          <form noValidate onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="sign-in-email">Work email</label>
              <input
                id="sign-in-email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby="sign-in-warning"
                aria-invalid={emailInvalid || undefined}
                onChange={clearFeedback}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="sign-in-password">Password</label>
              <input
                id="sign-in-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-describedby="sign-in-warning"
                aria-invalid={passwordInvalid || undefined}
                onChange={clearFeedback}
                required
              />
            </div>
            <label className={styles.interestOption} htmlFor="show-password">
              <input
                id="show-password"
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
              />
              Show password
            </label>
            <p className={styles.warning} id="sign-in-warning" role="alert" hidden={!warning}>
              {warning}
            </p>
            <button className={styles.submit} type="submit">Sign in</button>
          </form>
          <Link className={styles.backLink} href="/register">Create an account</Link>
        </section>
      </main>
    </div>
  );
}