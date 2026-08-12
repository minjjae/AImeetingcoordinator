export type PreferredTime = "morning" | "afternoon" | "none";

export type Member = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  attendanceRate: number;
  preferredTime: PreferredTime;
  required?: boolean;
};

export type MeetingContext = {
  title: string;
  type: "one_time" | "weekly" | "monthly";
  meetingNumber?: number;
  importance: "low" | "normal" | "high";
  duration: number;
};

export type Group = {
  id: string;
  name: string;
  members: Member[];
  meetingCount: number;
  averageAttendance: number;
  preferredMeetingTime?: PreferredTime;
  meeting: MeetingContext;
};

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";

export type AvailabilitySlot = {
  id: string;
  day: DayKey;
  dayLabel: string;
  dateLabel: string;
  time: string;
  timeLabel: string;
  availableMemberIds: string[];
};

export type CandidateInput = {
  slotId: string;
  requiredMemberAvailability: number;
  preferenceMatch: number;
  attendancePriority: number;
  meetingLoad: number;
  reasons: string[];
};

export type CandidateSlot = AvailabilitySlot & {
  endTime: string;
  availableMembers: Member[];
  unavailableMembers: Member[];
  availabilityRate: number;
  score: number;
  reasons: string[];
};
