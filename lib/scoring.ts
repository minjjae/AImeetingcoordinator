import type { AvailabilitySlot, CandidateInput, CandidateSlot, Group } from "./types";

const SCORE_WEIGHTS = {
  availability: 40,
  requiredMemberAvailability: 20,
  preferenceMatch: 15,
  attendancePriority: 15,
  meetingLoad: 10,
} as const;

function addOneHour(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return `${String(hours + 1).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function calculateCandidateScore(
  availableCount: number,
  memberCount: number,
  input: Omit<CandidateInput, "slotId" | "reasons">,
) {
  const availabilityRate = availableCount / memberCount;
  const score =
    availabilityRate * SCORE_WEIGHTS.availability +
    input.requiredMemberAvailability * SCORE_WEIGHTS.requiredMemberAvailability +
    input.preferenceMatch * SCORE_WEIGHTS.preferenceMatch +
    input.attendancePriority * SCORE_WEIGHTS.attendancePriority +
    input.meetingLoad * SCORE_WEIGHTS.meetingLoad;

  return Math.round(score);
}

export function rankCandidateSlots(
  group: Group,
  slots: AvailabilitySlot[],
  candidateInputs: CandidateInput[],
): CandidateSlot[] {
  return candidateInputs
    .map((input) => {
      const slot = slots.find((item) => item.id === input.slotId);
      if (!slot) {
        throw new Error(`Missing availability slot: ${input.slotId}`);
      }

      const availableMembers = group.members.filter((member) => slot.availableMemberIds.includes(member.id));
      const unavailableMembers = group.members.filter((member) => !slot.availableMemberIds.includes(member.id));

      return {
        ...slot,
        endTime: addOneHour(slot.time),
        availableMembers,
        unavailableMembers,
        availabilityRate: availableMembers.length / group.members.length,
        score: calculateCandidateScore(availableMembers.length, group.members.length, input),
        reasons: input.reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}
