import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

export type Person = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  job_role: string;
  job_capability: string;
  job_go_to_market: string;
  registered: boolean;
  interests: { id: number; name: string }[];
};

export async function checkEmail(email: string): Promise<{ registered: boolean }> {
  const { data } = await apiClient.post<{ registered: boolean }>("/people/check-email", { email });
  return data;
}

export async function login(email: string, password: string): Promise<Person> {
  const { data } = await apiClient.post<Person>("/people/login", { email, password });
  return data;
}

export async function setPassword(email: string, password: string): Promise<Person> {
  const { data } = await apiClient.post<Person>("/people/set-password", { email, password });
  return data;
}

export async function completeRegistration(personId: number, interestIds: number[]): Promise<Person> {
  const { data } = await apiClient.post<Person>(`/people/${personId}/complete-registration`, {
    interest_ids: interestIds,
  });
  return data;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string; errors?: { message: string }[] }>(error) && error.response) {
    const { message, errors } = error.response.data ?? {};
    return errors?.[0]?.message ?? message ?? fallback;
  }
  return fallback;
}

export const SESSION_PENDING_EMAIL_KEY = "coffee-connect-pending-email";

export const SESSION_PERSON_KEY = "coffee-connect-person";

export function storePerson(person: Person): void {
  sessionStorage.setItem(SESSION_PERSON_KEY, JSON.stringify(person));
}

export function getStoredPerson(): Person | null {
  const raw = sessionStorage.getItem(SESSION_PERSON_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Person;
  } catch {
    return null;
  }
}
