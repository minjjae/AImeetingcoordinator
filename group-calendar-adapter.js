(function attachFeetCalendarAdapter(globalScope) {
  "use strict";

  const MOCK_BUSY_BLOCKS = [
    { participantId: "minjae", eventId: "gcal-101", title: "기존 일정", start: "2026-08-17T10:00:00+09:00", end: "2026-08-17T12:00:00+09:00", status: "UNAVAILABLE" },
    { participantId: "jisoo", eventId: "gcal-102", title: "조정 가능한 개인 일정", start: "2026-08-18T14:00:00+09:00", end: "2026-08-18T15:30:00+09:00", status: "ADJUSTABLE" },
    { participantId: "seoyeon", eventId: "gcal-103", title: "기존 일정", start: "2026-08-19T13:00:00+09:00", end: "2026-08-19T15:00:00+09:00", status: "UNAVAILABLE" },
    { participantId: "junho", eventId: "gcal-104", title: "조정 가능한 개인 일정", start: "2026-08-20T16:00:00+09:00", end: "2026-08-20T17:00:00+09:00", status: "ADJUSTABLE" },
    { participantId: "yuna", eventId: "gcal-105", title: "기존 일정", start: "2026-08-21T19:00:00+09:00", end: "2026-08-21T21:00:00+09:00", status: "UNAVAILABLE" },
  ];

  // Google Calendar 담당 연결 지점.
  // 실제 연동 시 함수 이름과 반환 형식은 유지하고 내부만 API 호출로 교체합니다.
  // 이벤트 제목은 다른 그룹 멤버에게 노출하지 않고 알림 생성 단계에서만 사용합니다.
  async function getGroupBusyBlocks({ weekStart, participantIds }) {
    void weekStart;
    return MOCK_BUSY_BLOCKS.filter((block) => participantIds.includes(block.participantId));
  }

  globalScope.FeetCalendarAdapter = { getGroupBusyBlocks };
})(window);
