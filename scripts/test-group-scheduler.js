const assert = require("node:assert/strict");
const scheduler = require("../group-scheduler.js");

const participants = [
  { id: "host", name: "호스트", required: true },
  { id: "member", name: "멤버", required: false },
];

const preferences = {
  preferredWeekdays: [3],
  preferredStartMinutes: 21 * 60,
  preferredEndMinutes: 22 * 60,
  preferredMode: "online",
};

const allAvailable = scheduler.optimizeMeeting({
  participants,
  busyBlocks: [],
  request: { weekStart: "2026-08-17", durationMinutes: 60, mode: "online" },
  groupPreferences: preferences,
});

assert.equal(allAvailable.confirmedSlot.status, scheduler.RESULT_STATUS.ALL_AVAILABLE);
assert.equal(allAvailable.confirmedSlot.start.getDay(), 3);
assert.equal(allAvailable.confirmedSlot.start.getHours(), 21);
assert.equal(allAvailable.confirmedSlot.metrics.preferenceScore, 1);

const candidate = {
  start: new Date("2026-08-19T21:00:00+09:00"),
  end: new Date("2026-08-19T22:00:00+09:00"),
  mode: "online",
};
const adjustable = scheduler.evaluateCandidate(
  candidate,
  participants,
  [{
    participantId: "member",
    eventId: "adjustable-event",
    title: "조정 가능 일정",
    start: new Date("2026-08-19T21:00:00+09:00"),
    end: new Date("2026-08-19T22:00:00+09:00"),
    status: scheduler.STATUS.ADJUSTABLE,
  }],
  preferences,
);
assert.equal(adjustable.status, scheduler.RESULT_STATUS.ADJUSTMENT_REQUIRED);
assert.deepEqual(adjustable.adjustableParticipants.map((member) => member.id), ["member"]);

const requiredMissing = scheduler.evaluateCandidate(
  candidate,
  participants,
  [{
    participantId: "host",
    eventId: "fixed-event",
    title: "필수 일정",
    start: new Date("2026-08-19T20:30:00+09:00"),
    end: new Date("2026-08-19T22:30:00+09:00"),
    status: scheduler.STATUS.UNAVAILABLE,
  }],
  preferences,
);
assert.equal(requiredMissing.status, scheduler.RESULT_STATUS.REQUIRED_MEMBER_MISSING);
assert.deepEqual(requiredMissing.unavailableParticipants.map((member) => member.id), ["host"]);

assert.ok(
  scheduler.compareEvaluations(allAvailable.confirmedSlot, adjustable) < 0,
  "전원 즉시 참석 후보가 조정 필요 후보보다 먼저여야 합니다.",
);
assert.ok(
  scheduler.compareEvaluations(adjustable, requiredMissing) < 0,
  "조정 후 전원 참석 후보가 필수 참석자 불참 후보보다 먼저여야 합니다.",
);

const weekStart = new Date("2026-08-17T00:00:00+09:00");
const weekEnd = new Date("2026-08-24T00:00:00+09:00");
const adjustmentOnly = scheduler.optimizeMeeting({
  participants,
  busyBlocks: [{
    participantId: "member",
    eventId: "adjust-all-week",
    title: "조정 가능한 주간 일정",
    start: weekStart,
    end: weekEnd,
    status: scheduler.STATUS.ADJUSTABLE,
  }],
  request: { weekStart: "2026-08-19", durationMinutes: 60, mode: "online" },
  groupPreferences: preferences,
});
assert.equal(adjustmentOnly.confirmedSlot.status, scheduler.RESULT_STATUS.ADJUSTMENT_REQUIRED);
assert.equal(adjustmentOnly.notifications.adjustmentRequired.length, 1);
assert.equal(adjustmentOnly.confirmedSlot.start.getDay(), 3);

const partialOnly = scheduler.optimizeMeeting({
  participants,
  busyBlocks: [{
    participantId: "member",
    eventId: "fixed-all-week",
    title: "변경 불가 주간 일정",
    start: weekStart,
    end: weekEnd,
    status: scheduler.STATUS.UNAVAILABLE,
  }],
  request: { weekStart: "2026-08-17", durationMinutes: 60, mode: "online" },
  groupPreferences: preferences,
});
assert.equal(partialOnly.confirmedSlot.status, scheduler.RESULT_STATUS.PARTIAL_ATTENDANCE);
assert.equal(partialOnly.notifications.unavailable.length, 1);

console.log("group scheduler tests: 6 passed");
