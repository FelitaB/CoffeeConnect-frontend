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

export type CreatePersonInput = Pick<Person,
  "first_name" | "last_name" | "email" | "location" | "job_role" | "job_capability" | "job_go_to_market"
>;

export async function createPerson(input: CreatePersonInput): Promise<Person> {
  const { data } = await apiClient.post<Person>("/people", { ...input, interest_ids: [] });
  return data;
}

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

export async function saveInterests(person: Person, interestIds: number[]): Promise<Person> {
  const payload = { interest_ids: interestIds };
  const { data } = person.registered
    ? await apiClient.patch<Person>(`/people/${person.id}`, payload)
    : await apiClient.post<Person>(`/people/${person.id}/complete-registration`, payload);
  return data;
}

export const SESSION_PERSON_KEY = "coffee-connect-person";
export const SETUP_EMAIL_KEY = "coffee-connect-setup-email";

export function getStoredPerson(): Person | null {
  const raw = sessionStorage.getItem(SESSION_PERSON_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Person;
  } catch {
    return null;
  }
}

export function storePerson(person: Person): void {
  sessionStorage.setItem(SESSION_PERSON_KEY, JSON.stringify(person));
}
