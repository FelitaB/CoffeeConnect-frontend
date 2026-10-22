import { apiClient, type Person } from "./api";

export type Meetup = {
  id: number;
  status: "PENDING" | "ACCEPTED";
  matched_at: string;
  completed_at: string | null;
  direction: "incoming" | "outgoing";
  colleague: Person;
};

export async function fetchMeetups(personId: number, signal: AbortSignal): Promise<Meetup[]> {
  const { data } = await apiClient.get<Meetup[]>(`/people/${personId}/meetups`, { signal });
  return data;
}

export type MeetupAction = "accept" | "decline" | "complete";

export async function respondToMeetup(personId: number, matchId: number, action: MeetupAction) {
  const { data } = await apiClient.post<{ completed_at?: string }>(
    `/people/${personId}/matches/${matchId}/${action}`,
  );
  return data;
}