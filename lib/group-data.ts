import type { AvailabilitySlot, CandidateInput, Group } from "./types";

export const hackathonGroup: Group = {
  id: "hackathon-team",
  name: "Hackathon Team",
  meetingCount: 12,
  averageAttendance: 87,
  preferredMeetingTime: "afternoon",
  meeting: {
    title: "Hackathon Weekly Sync",
    type: "weekly",
    meetingNumber: 12,
    importance: "high",
    duration: 60,
  },
  members: [
    { id: "minjae", name: "Minjae Kim", initials: "MK", avatarColor: "#315b4c", attendanceRate: 95, preferredTime: "afternoon", required: true },
    { id: "jisoo", name: "Jisoo Park", initials: "JP", avatarColor: "#c66a4e", attendanceRate: 72, preferredTime: "morning" },
    { id: "hyunwoo", name: "Hyunwoo Lee", initials: "HL", avatarColor: "#566a8a", attendanceRate: 88, preferredTime: "afternoon", required: true },
    { id: "sora", name: "Sora Choi", initials: "SC", avatarColor: "#8b7654", attendanceRate: 91, preferredTime: "none" },
    { id: "daniel", name: "Daniel Han", initials: "DH", avatarColor: "#78607d", attendanceRate: 84, preferredTime: "afternoon" },
  ],
};

const all = ["minjae", "jisoo", "hyunwoo", "sora", "daniel"];
const without = (...ids: string[]) => all.filter((id) => !ids.includes(id));

const availability: Array<[string, string[][]]> = [
  ["09:00", [without("sora", "daniel"), without("hyunwoo"), without("minjae", "daniel"), all, without("jisoo", "sora")]],
  ["10:00", [without("daniel"), without("sora"), without("jisoo", "daniel"), all, without("hyunwoo")]],
  ["11:00", [without("jisoo", "sora", "daniel"), all, without("minjae", "hyunwoo"), without("daniel"), without("sora", "daniel")]],
  ["13:00", [without("hyunwoo", "sora"), all, without("jisoo"), without("jisoo", "daniel"), all]],
  ["14:00", [without("jisoo"), all, without("daniel"), without("hyunwoo"), without("minjae", "sora")]],
  ["15:00", [without("hyunwoo", "daniel"), without("sora"), all, without("jisoo"), without("minjae", "hyunwoo", "daniel")]],
  ["16:00", [without("jisoo", "sora"), without("minjae"), without("hyunwoo"), without("daniel"), without("jisoo")]],
];

const days = [
  { key: "mon", label: "Monday", short: "Mon", date: "Aug 17" },
  { key: "tue", label: "Tuesday", short: "Tue", date: "Aug 18" },
  { key: "wed", label: "Wednesday", short: "Wed", date: "Aug 19" },
  { key: "thu", label: "Thursday", short: "Thu", date: "Aug 20" },
  { key: "fri", label: "Friday", short: "Fri", date: "Aug 21" },
] as const;

export const availabilitySlots: AvailabilitySlot[] = availability.flatMap(([time, members]) =>
  days.map((day, index) => ({
    id: `${day.key}-${time.replace(":", "")}`,
    day: day.key,
    dayLabel: day.label,
    dateLabel: day.date,
    time,
    timeLabel: `${Number(time.slice(0, 2)) > 12 ? Number(time.slice(0, 2)) - 12 : Number(time.slice(0, 2))}:00 ${Number(time.slice(0, 2)) >= 12 ? "PM" : "AM"}`,
    availableMemberIds: members[index],
  })),
);

export const candidateInputs: CandidateInput[] = [
  {
    slotId: "tue-1400",
    requiredMemberAvailability: 1,
    preferenceMatch: 1,
    attendancePriority: 0.67,
    meetingLoad: 0.9,
    reasons: ["All members available", "Matches afternoon preference", "Required members available"],
  },
  {
    slotId: "wed-1600",
    requiredMemberAvailability: 1,
    preferenceMatch: 1,
    attendancePriority: 0.6,
    meetingLoad: 0.6,
    reasons: ["Required members available", "Matches afternoon preference", "One member has a conflict"],
  },
  {
    slotId: "thu-1300",
    requiredMemberAvailability: 1,
    preferenceMatch: 0.6,
    attendancePriority: 0.8,
    meetingLoad: 0.6,
    reasons: ["Required members available", "Protects recent attendance", "Moderate meeting load"],
  },
];

export const calendarTimes = availability.map(([time]) => time);
export const calendarDays = days;
