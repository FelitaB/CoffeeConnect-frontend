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

export const SESSION_PERSON_KEY = "coffee-connect-person";

export function storePerson(person: Person): void {
  sessionStorage.setItem(SESSION_PERSON_KEY, JSON.stringify(person));
}
