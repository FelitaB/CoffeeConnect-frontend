import { apiClient, type Person } from "./api";

export type Meetup = {
  id: number;
  status: "PENDING" | "ACCEPTED";
  matched_at: string;
  completed_at: string | null;
  direction: "incoming" | "outgoing";
  colleague: Person;
  booking: Booking | null;
};

export type BookingSlot = {
  id: number;
  starts_at: string;
};

export type BookingProposal = {
  id: number;
  status: "OPEN" | "ACCEPTED" | "SUPERSEDED";
  proposed_by: number;
  proposer: Pick<Person, "id" | "first_name" | "last_name">;
  created_at: string;
  slots: BookingSlot[];
};

export type Booking = {
  id: number;
  status: "PROPOSED" | "CONFIRMED";
  scheduled_at: string | null;
  confirmed_at: string | null;
  proposals: BookingProposal[];
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

export async function proposeBookingTimes(personId: number, matchId: number, slots: string[]): Promise<Booking> {
  const { data } = await apiClient.post<Booking>(`/people/${personId}/matches/${matchId}/booking/propose`, { slots });
  return data;
}

export async function acceptBookingTime(personId: number, matchId: number, slotId: number): Promise<Booking> {
  const { data } = await apiClient.post<Booking>(`/people/${personId}/matches/${matchId}/booking/accept`, { slot_id: slotId });
  return data;
}