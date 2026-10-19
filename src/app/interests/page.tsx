"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { getStoredPerson, saveInterests, storePerson } from "@/lib/api";
import DemoAuthGate, { SignOutButton } from "../auth-gate";
import CompanyLogo from "../company-logo";
import styles from "../page.module.css";

type Interest = {
  interest_id: number;
  name: string;
};

const INTERESTS: Interest[] = [
  { interest_id: 1, name: "Coffee and cafes" },
  { interest_id: 2, name: "Cooking and food" },
  { interest_id: 3, name: "Books and reading" },
  { interest_id: 4, name: "Hiking and outdoors" },
  { interest_id: 5, name: "Travel" },
  { interest_id: 6, name: "Music and live events" },
  { interest_id: 7, name: "Photography" },
  { interest_id: 8, name: "Board games" },
  { interest_id: 9, name: "Fitness and running" },
  { interest_id: 10, name: "Technology" },
  { interest_id: 11, name: "Art and design" },
  { interest_id: 12, name: "Gardening" },
  { interest_id: 13, name: "Video Games" },
  { interest_id: 14, name: "Movies and TV" },
  { interest_id: 15, name: "Podcasts" },
  { interest_id: 16, name: "Sports" },
  { interest_id: 17, name: "Cycling" },
  { interest_id: 18, name: "Volunteering" },
  { interest_id: 19, name: "Languages" },
  { interest_id: 20, name: "History" },
  { interest_id: 21, name: "Personal finance" },
  { interest_id: 22, name: "Entrepreneurship" },
  { interest_id: 23, name: "Mindfulness" },
  { interest_id: 24, name: "Pets" },
];

export default function InterestsPage() {
  return (
    <DemoAuthGate returnTo="/interests">
      <InterestsPageContent />
    </DemoAuthGate>
  );
}

function InterestsPageContent() {
  const router = useRouter();
  const [interests, setInterests] = useState<Interest[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [selectedInterestIds, setSelectedInterestIds] = useState<number[]>(() => getStoredPerson()?.interests.map((interest) => interest.id) ?? []);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.resolve(INTERESTS)
      .then((options) => {
        if (active) {
          setInterests(options);
        }
      })
      .catch(() => {
        if (active) {
          setLoadError("Unable to load interests. Please try again.");
        }
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  function toggleInterest(interestId: number) {
    setSelectedInterestIds((currentIds) => {
      if (currentIds.includes(interestId)) {
        return currentIds.filter((item) => item !== interestId);
      }
      if (currentIds.length >= 10) {
        return currentIds;
      }
      return [...currentIds, interestId];
    });
    setError("");
    setStatus("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setStatus("");

    if (!interests || loadError) {
      setError("Wait until interests have loaded before saving.");
      return;
    }

    if (selectedInterestIds.length < 3) {
      setError("Select at least three interests to continue.");
      return;
    }

    if (selectedInterestIds.length > 10) {
      setError("You can select up to 10 interests.");
      return;
    }

    const person = getStoredPerson();
    if (!person) {
      setError("Sign in with your work email before saving interests.");
      return;
    }

    setSubmitting(true);
    try {
      const updatedPerson = await saveInterests(person, selectedInterestIds);
      storePerson(updatedPerson);
      setError("");
      router.replace("/home");
    } catch {
      setError("Unable to save your interests. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
            <p>Build your profile</p>
            <SignOutButton />
            <Link className={styles.headerHomeLink} href="/">Back to homepage</Link>
            <CompanyLogo />
          </div>
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
              {loadError ? (
                <>
                  <p className={styles.warning} role="alert">{loadError}</p>
                  <button
                    className={styles.submit}
                    type="button"
                    onClick={() => {
                      setLoadError("");
                      setInterests(null);
                      setLoadAttempt((attempt) => attempt + 1);
                    }}
                  >
                    Retry loading interests
                  </button>
                </>
              ) : interests === null ? (
                <p className={styles.status} role="status">Loading interests...</p>
              ) : (
                <details className={styles.interestDropdown}>
                  <summary
                    className={styles.interestSummary}
                    aria-describedby="interest-guidance"
                  >
                    {selectedInterestIds.length === 0
                      ? "Choose interests"
                      : `${selectedInterestIds.length} selected`}
                  </summary>
                  <div className={styles.interestOptions} role="group" aria-label="Interests">
                    {interests.map((interest) => {
                      const selected = selectedInterestIds.includes(interest.interest_id);
                      return (
                        <label className={styles.interestOption} key={interest.interest_id} htmlFor={`interest-${interest.interest_id}`}>
                          <input
                            id={`interest-${interest.interest_id}`}
                            type="checkbox"
                            value={interest.interest_id}
                            checked={selected}
                            disabled={submitting || (!selected && selectedInterestIds.length >= 10)}
                            onChange={() => toggleInterest(interest.interest_id)}
                          />
                          {interest.name}
                        </label>
                      );
                    })}
                  </div>
                </details>
              )}
              <p className={styles.interestGuidance} id="interest-guidance">
                Select at least 3 and no more than 10.
              </p>
              <p className={styles.interestCount} aria-live="polite">
                {selectedInterestIds.length} of 10 selected
              </p>
            </div>
            <p className={styles.warning} role="alert" hidden={!error}>{error}</p>
            <p className={styles.status} role="status">{status}</p>
            <button className={styles.submit} type="submit" disabled={submitting || !interests || Boolean(loadError)}>
              {submitting ? "Saving..." : "Save interests"}
            </button>
          </form>
          <Link className={styles.backLink} href="/sign-in">Back to sign in</Link>
        </section>
      </main>
    </div>
  );
}