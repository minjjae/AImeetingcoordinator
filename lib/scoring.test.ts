import { describe, expect, it } from "vitest";
import { availabilitySlots, candidateInputs, hackathonGroup } from "./group-data";
import { calculateCandidateScore, rankCandidateSlots } from "./scoring";

describe("candidate scoring", () => {
  it("applies the PRD scoring weights", () => {
    expect(calculateCandidateScore(5, 5, {
      requiredMemberAvailability: 1,
      preferenceMatch: 1,
      attendancePriority: 0.67,
      meetingLoad: 0.9,
    })).toBe(94);
  });

  it("ranks the demo fixture in the expected order", () => {
    const ranked = rankCandidateSlots(hackathonGroup, availabilitySlots, candidateInputs);

    expect(ranked.map((slot) => slot.id)).toEqual(["tue-1400", "wed-1600", "thu-1300"]);
    expect(ranked.map((slot) => slot.score)).toEqual([94, 82, 79]);
    expect(ranked[0].availableMembers).toHaveLength(5);
    expect(ranked[1].unavailableMembers.map((member) => member.name)).toEqual(["Hyunwoo Lee"]);
    expect(ranked[2].unavailableMembers.map((member) => member.name)).toEqual(["Jisoo Park"]);
  });
});
