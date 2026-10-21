export type Meetup = {
  id: string;
  personName: string;
  location: "LONDON" | "MANCHESTER" | "BELFAST";
  datetime: number;
  status: "PENDING" | "ACCEPTED" | "COMPLETED";
};

export const LOCATION_NAMES: Record<Meetup["location"], string> = {
  LONDON: "London Office",
  MANCHESTER: "Manchester Office",
  BELFAST: "Belfast Office",
};

export const MOCK_MEETUPS: Meetup[] = [
  {
    id: "meetup-1",
    personName: "Amelia Khan",
    location: "LONDON",
    datetime: Date.UTC(2026, 9, 20, 10, 30) / 1000,
    status: "ACCEPTED",
  },
  {
    id: "meetup-2",
    personName: "Daniel Murphy",
    location: "BELFAST",
    datetime: Date.UTC(2026, 9, 22, 13, 0) / 1000,
    status: "PENDING",
  },
  {
    id: "meetup-3",
    personName: "Oliver Bennett",
    location: "MANCHESTER",
    datetime: Date.UTC(2026, 9, 26, 11, 0) / 1000,
    status: "ACCEPTED",
  },
  {
    id: "meetup-4",
    personName: "Priya Shah",
    location: "LONDON",
    datetime: Date.UTC(2026, 9, 8, 9, 30) / 1000,
    status: "COMPLETED",
  },
  {
    id: "meetup-5",
    personName: "Ethan Williams",
    location: "BELFAST",
    datetime: Date.UTC(2026, 9, 12, 14, 0) / 1000,
    status: "COMPLETED",
  },
  {
    id: "meetup-6",
    personName: "Sofia Patel",
    location: "MANCHESTER",
    datetime: Date.UTC(2026, 9, 15, 11, 30) / 1000,
    status: "COMPLETED",
  },
];

export const UPCOMING_MEETUPS = MOCK_MEETUPS.filter((meetup) => meetup.status !== "COMPLETED");
export const PAST_MEETUPS = MOCK_MEETUPS.filter((meetup) => meetup.status === "COMPLETED");