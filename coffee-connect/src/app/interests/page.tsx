"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import styles from "../page.module.css";

const INTEREST_OPTIONS = [
  "Cooking and food",
  "Books and reading",
  "Hiking and outdoors",
  "Travel",
  "Music and live events",
  "Photography",
  "Board games",
  "Fitness and running",
  "Technology",
  "Art and design",
  "Gardening",
  "Video Games",
  "Movies and TV",
  "Podcasts",
  "Sports",
  "Cycling",
  "Volunteering",
  "Languages",
  "History",
  "Personal finance",
  "Entrepreneurship",
  "Mindfulness",
  "Pets",
] as const;

const INTERESTS_STORAGE_KEY = "coffee-connect-interests";

export default function InterestsPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  function toggleInterest(interest: string) {
    setSelectedInterests((currentInterests) => {
      if (currentInterests.includes(interest)) {
        return currentInterests.filter((item) => item !== interest);
      }
      if (currentInterests.length >= 10) {
        return currentInterests;
      }
      return [...currentInterests, interest];
    });
    setError("");
    setStatus("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (selectedInterests.length < 3) {
      setError("Select at least three interests to continue.");
      return;
    }

    if (selectedInterests.length > 10) {
      setError("You can select up to 10 interests.");
      return;
    }

    localStorage.setItem(INTERESTS_STORAGE_KEY, JSON.stringify(selectedInterests));
    setError("");
    setStatus("Your interests have been saved.");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true">C</span>
            <span>CoffeeConnect</span>
          </Link>
          <p>Build your profile</p>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <section className={styles.registration} aria-labelledby="interests-heading">
          <h2 id="interests-heading">Choose your interests</h2>
          <p className={styles.registrationIntro}>
            Select 3 to 10 interests to help us find a great coffee match.
          </p>
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Interests</span>
              <details className={styles.interestDropdown}>
                <summary
                  className={styles.interestSummary}
                  aria-describedby="interest-guidance"
                >
                  {selectedInterests.length === 0
                    ? "Choose interests"
                    : `${selectedInterests.length} selected`}
                </summary>
                <div className={styles.interestOptions} role="group" aria-label="Interests">
                  {INTEREST_OPTIONS.map((interest, index) => {
                    const selected = selectedInterests.includes(interest);
                    return (
                      <label className={styles.interestOption} key={interest} htmlFor={`interest-${index}`}>
                        <input
                          id={`interest-${index}`}
                          type="checkbox"
                          checked={selected}
                          disabled={!selected && selectedInterests.length >= 10}
                          onChange={() => toggleInterest(interest)}
                        />
                        {interest}
                      </label>
                    );
                  })}
                </div>
              </details>
              <p className={styles.interestGuidance} id="interest-guidance">
                Select at least 3 and no more than 10.
              </p>
              <p className={styles.interestCount} aria-live="polite">
                {selectedInterests.length} of 10 selected
              </p>
            </div>
            <p className={styles.warning} role="alert" hidden={!error}>{error}</p>
            <p className={styles.status} role="status">{status}</p>
            <button className={styles.submit} type="submit">Save interests</button>
          </form>
          <Link className={styles.backLink} href="/">Back to registration</Link>
        </section>
      </main>
    </div>
  );
}