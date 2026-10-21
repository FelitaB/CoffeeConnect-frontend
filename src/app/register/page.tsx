"use client";

import axios from "axios";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createPerson, type Person, SETUP_EMAIL_KEY, setPassword, storePerson } from "@/lib/api";
import { startDemoSession } from "@/components/auth-gate";
import { JOB_CAPABILITIES, JOB_GO_TO_MARKETS, JOB_ROLES } from "./constants";
import styles from "../page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [warning, setWarning] = useState("");
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdPerson, setCreatedPerson] = useState<Person | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setWarning("");

    const form = event.currentTarget;
    const emailInput = form.querySelector<HTMLInputElement>("#email");
    const passwordInput = form.querySelector<HTMLInputElement>("#password");

    if (!emailInput || !passwordInput) {
      return;
    }

    emailInput.value = emailInput.value.trim().toLowerCase();
    const validEmail =
      emailInput.validity.valid &&
      emailInput.value.toLowerCase().endsWith("@paconsulting.com");
    const password = passwordInput.value;
    const validPassword = password.length >= 8 && password.length <= 20 &&
      /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9\s]/.test(password);
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
      messages.push("Use 8 to 20 characters, including a capital letter, a number and a symbol.");
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

    const fields = new FormData(form);
    let person = createdPerson;
    setSubmitting(true);

    try {
      if (!person) {
        person = await createPerson({
          first_name: String(fields.get("firstName") ?? "").trim(),
          last_name: String(fields.get("lastName") ?? "").trim(),
          email: emailInput.value,
          location: String(fields.get("location") ?? ""),
          job_role: String(fields.get("job_role") ?? ""),
          job_capability: String(fields.get("job_capability") ?? ""),
          job_go_to_market: String(fields.get("job_go_to_market") ?? ""),
        });
        setCreatedPerson(person);
        sessionStorage.setItem(SETUP_EMAIL_KEY, person.email);
      }

      const updatedPerson = await setPassword(person.email, password, String(person.id));
      storePerson(updatedPerson);
      startDemoSession();
      sessionStorage.removeItem(SETUP_EMAIL_KEY);
      form.reset();
      router.push("/interests");
    } catch (error) {
      if (person) {
        setWarning("Your profile was created, but password setup could not be completed. Please retry, or return to sign in to resume setup.");
      } else if (axios.isAxiosError(error) && error.response && error.response.status < 500) {
        setWarning("Unable to create your account. Check your details, or sign in if you already have a profile.");
      } else {
        setWarning("Unable to reach CoffeeConnect right now. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <main className={styles.main} id="main-content">
        <section className={styles.registration} aria-labelledby="registration-heading">
          <h2 id="registration-heading">Register</h2>
          <p className={styles.registrationIntro}>
            Create your profile to find colleagues with shared interests.
          </p>
          <form id="registration-form" noValidate onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="first-name">First name</label>
              <input id="first-name" name="firstName" autoComplete="given-name" required disabled={submitting || Boolean(createdPerson)} />
                    </div>
            <div className={styles.field}>
              <label htmlFor="last-name">Last name</label>
              <input id="last-name" name="lastName" autoComplete="family-name" required disabled={submitting || Boolean(createdPerson)} />
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
                disabled={submitting || Boolean(createdPerson)}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="location">Location</label>
              <select id="location" name="location" defaultValue="" required disabled={submitting || Boolean(createdPerson)}>
                <option value="" disabled>Select your location</option>
                <option value="LONDON">London Office</option>
                <option value="MANCHESTER">Manchester Office</option>
                <option value="BELFAST">Belfast Office</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="job-role">Job role</label>
              <select id="job-role" name="job_role" defaultValue="" required disabled={submitting || Boolean(createdPerson)}>
                <option value="" disabled>Select your job role</option>
                {JOB_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="job-capability">Job capability</label>
              <select id="job-capability" name="job_capability" defaultValue="" required disabled={submitting || Boolean(createdPerson)}>
                <option value="" disabled>Select your capability</option>
                {JOB_CAPABILITIES.map((capability) => <option key={capability} value={capability}>{capability}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="job-go-to-market">Go-to-market</label>
              <select id="job-go-to-market" name="job_go_to_market" defaultValue="" required disabled={submitting || Boolean(createdPerson)}>
                <option value="" disabled>Select your go-to-market</option>
                {JOB_GO_TO_MARKETS.map((market) => <option key={market} value={market}>{market}</option>)}
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
                maxLength={20}
                aria-describedby="password-guidance registration-warning"
                aria-invalid={passwordInvalid || undefined}
                disabled={submitting}
                required
              />
              <p className={styles.interestGuidance} id="password-guidance">8 to 20 characters, including a capital letter, a number and a symbol.</p>
            </div>
            <p
              className={styles.warning}
              id="registration-warning"
              role="alert"
              hidden={!warning}
            >
              {warning}
            </p>
            <button className={styles.submit} type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Continue to interests"}
            </button>
          </form>
          <Link className={styles.backLink} href="/sign-in">Already have an account? Sign in</Link>
        </section>
      </main>
    </>
  );
}