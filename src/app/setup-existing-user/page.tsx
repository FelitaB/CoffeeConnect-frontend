"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useSyncExternalStore } from "react";
import { SETUP_EMAIL_KEY, setPassword, storePerson, verifySetupIdentity } from "@/lib/api";
import { startDemoSession } from "@/components/auth-gate";
import styles from "../page.module.css";

function subscribe() {
  return () => {};
}

function getSetupEmail() {
  return sessionStorage.getItem(SETUP_EMAIL_KEY) ?? "";
}

export default function SetupExistingUserPage() {
  const router = useRouter();
  const email = useSyncExternalStore(subscribe, getSetupEmail, () => "");
  const [warning, setWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verifiedUserId, setVerifiedUserId] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !email) return;
    setWarning("");

    const form = event.currentTarget;
    const fields = new FormData(form);
    if (!verifiedUserId) {
      const userId = String(fields.get("user_id") ?? "").trim();
      if (!/^\d{5}$/.test(userId)) {
        setWarning("Enter your 5-digit user ID.");
        return;
      }

      setSubmitting(true);
      try {
        const { verified } = await verifySetupIdentity(email, userId);
        if (verified) {
          setVerifiedUserId(userId);
        } else {
          setWarning("Your user ID and email do not match an account awaiting setup.");
        }
      } catch (error) {
        setWarning(axios.isAxiosError(error) && error.response && error.response.status < 500
          ? "Unable to verify your email and user ID. Check your details and try again."
          : "Unable to reach CoffeeConnect right now. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const password = String(fields.get("password") ?? "");
    const confirmation = String(fields.get("confirmation") ?? "");

    if (password.length < 8 || password.length > 20 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
      setWarning("Use 8 to 20 characters, including a capital letter, a number and a symbol.");
      return;
    }
    if (password !== confirmation) {
      setWarning("Your passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const person = await setPassword(email, password, verifiedUserId);
      storePerson(person);
      startDemoSession();
      sessionStorage.removeItem(SETUP_EMAIL_KEY);
      form.reset();
      router.replace("/interests");
    } catch (error) {
      setWarning(axios.isAxiosError(error) && error.response && error.response.status < 500
        ? "Unable to set up this account. Return to sign in or contact support if your work email is not recognised."
        : "Unable to reach CoffeeConnect right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <main className={styles.main} id="main-content">
        <section className={styles.registration} aria-labelledby="setup-heading">
          <h2 id="setup-heading">Finish setting up your account</h2>
          {email ? (
            <>
              <p className={styles.registrationIntro}>{verifiedUserId ? `Choose a password for ${email}.` : `Confirm your user ID for ${email}.`}</p>
              <form key={verifiedUserId ? "password" : "identity"} noValidate onSubmit={handleSubmit}>
                <input type="hidden" name="email" autoComplete="username" value={email} />
                {!verifiedUserId ? (
                  <div className={styles.field}>
                    <label htmlFor="setup-user-id">User ID</label>
                    <input id="setup-user-id" name="user_id" type="text" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="off" aria-describedby="setup-warning" required disabled={submitting} autoFocus />
                  </div>
                ) : (
                  <>
                <div className={styles.field}>
                  <label htmlFor="setup-password">Password</label>
                  <input id="setup-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={20} aria-describedby="password-guidance setup-warning" required disabled={submitting} autoFocus />
                  <p className={styles.interestGuidance} id="password-guidance">8 to 20 characters, including a capital letter, a number and a symbol.</p>
                            </div>
                <div className={styles.field}>
                  <label htmlFor="setup-confirmation">Confirm password</label>
                  <input id="setup-confirmation" name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" aria-describedby="setup-warning" required disabled={submitting} />
                </div>
                <label className={styles.interestOption} htmlFor="setup-show-password">
                  <input id="setup-show-password" type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
                  Show passwords
                </label>
                  </>
                )}
                <p className={styles.warning} id="setup-warning" role="alert" hidden={!warning}>{warning}</p>
                <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? (verifiedUserId ? "Saving..." : "Checking...") : (verifiedUserId ? "Continue to interests" : "Continue")}</button>
              </form>
            </>
          ) : (
            <p className={styles.registrationIntro}>Enter your work email on the sign-in page to start account setup.</p>
          )}
          <Link className={styles.backLink} href="/sign-in">Back to sign in</Link>
        </section>
      </main>
    </>
  );
}
