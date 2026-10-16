"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import CompanyLogo from "../company-logo";
import { checkEmail, login, storePerson } from "@/lib/api";
import styles from "../page.module.css";

type Step = "email" | "password";

const EMAIL_DOMAIN = "@paconsulting.com";

function isValidWorkEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.toLowerCase().endsWith(EMAIL_DOMAIN);
}

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState("");
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWarning("");

    const form = event.currentTarget;
    const emailInput = form.querySelector<HTMLInputElement>("#sign-in-email");
    const passwordInput = form.querySelector<HTMLInputElement>("#sign-in-password");
  async function handleEmailSubmit() {
    const trimmedEmail = email.trim();
    setEmail(trimmedEmail);

    if (!isValidWorkEmail(trimmedEmail)) {
      setEmailInvalid(true);
      setWarning(`Use a valid work email ending in ${EMAIL_DOMAIN}.`);
      return;
    }

    const { registered } = await checkEmail(trimmedEmail);
    if (registered) {
      setStep("password");
    } else {
      router.push("/setup-existing-user");
    }
  }

  async function handlePasswordSubmit() {
    if (password.length === 0) {
      setPasswordInvalid(true);
      setWarning("Enter your password.");
      return;
    }

    try {
      const person = await login(email, password);
      storePerson(person);
      router.push("/home");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setPassword("");
        setPasswordInvalid(true);
        setWarning("Incorrect email or password.");
        return;
      }
      throw error;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWarning("");
    setSubmitting(true);

    try {
      if (step === "email") {
        await handleEmailSubmit();
      } else {
        await handlePasswordSubmit();
      }
    } catch {
      setWarning("Unable to reach CoffeeConnect right now. Please try again.");
    } finally {
      setSubmitting(false);
    }

    passwordInput.value = "";
    setShowPassword(false);
    router.push("/meetups");
  }

  function changeEmail() {
    setStep("email");
    setPassword("");
    setShowPassword(false);
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
            {step === "email" ? "Welcome back to CoffeeConnect." : `Signing in as ${email}`}
          </p>
          <p className={styles.status} role="status">
            Demo only: sign-in is not connected. A valid work email and non-empty password will open the sample meetups.
          </p>
          <form noValidate onSubmit={handleSubmit}>
            {step === "email" ? (
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
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailInvalid(false);
                    setWarning("");
                  }}
                  required
                />
              </div>
            ) : (
              <>
                <input type="hidden" name="email" autoComplete="username" value={email} />
                <div className={styles.field}>
                  <label htmlFor="sign-in-password">Password</label>
                  <input
                    id="sign-in-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-describedby="sign-in-warning"
                    aria-invalid={passwordInvalid || undefined}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordInvalid(false);
                      setWarning("");
                    }}
                    autoFocus
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
              </>
            )}
            <p className={styles.warning} id="sign-in-warning" role="alert" hidden={!warning}>
              {warning}
            </p>
            <button className={styles.submit} type="submit" disabled={submitting}>
              {submitting ? "Please wait..." : step === "email" ? "Continue" : "Sign in"}
            </button>
          </form>
          {step === "password" ? (
            <button className={styles.backLink} type="button" onClick={changeEmail}>
              Use a different email
            </button>
          ) : (
            <Link className={styles.backLink} href="/register">Create an account</Link>
          )}
        </section>
      </main>
    </div>
  );
}
