(function attachFeetScheduler(globalScope) {
  "use strict";

  const STATUS = {
    AVAILABLE: "AVAILABLE",
    ADJUSTABLE: "ADJUSTABLE",
    UNAVAILABLE: "UNAVAILABLE",
  };

  const RESULT_STATUS = {
    ALL_AVAILABLE: "ALL_AVAILABLE",
    ADJUSTMENT_REQUIRED: "ADJUSTMENT_REQUIRED",
    PARTIAL_ATTENDANCE: "PARTIAL_ATTENDANCE",
    REQUIRED_MEMBER_MISSING: "REQUIRED_MEMBER_MISSING",
  };

  const DEFAULTS = {
    intervalMinutes: 30,
    searchStartMinutes: 9 * 60,
    searchEndMinutes: 23 * 60,
    timezone: "Asia/Seoul",
  };

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  function startOfDay(date) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  function startOfWeek(date) {
    const selectedDay = startOfDay(date);
    const daysSinceMonday = (selectedDay.getDay() + 6) % 7;
    return addMinutes(selectedDay, -daysSinceMonday * 24 * 60);
  }

  function overlaps(start, end, busyStart, busyEnd) {
    return start < busyEnd && end > busyStart;
  }

  function normalizeBusyBlocks(blocks) {
    return blocks.map((block) => ({
      ...block,
      start: block.start instanceof Date ? block.start : new Date(block.start),
      end: block.end instanceof Date ? block.end : new Date(block.end),
      status: block.status === STATUS.ADJUSTABLE ? STATUS.ADJUSTABLE : STATUS.UNAVAILABLE,
    }));
  }

  function generateCandidateSlots(request, options) {
    const settings = { ...DEFAULTS, ...options };
    const weekStart = startOfWeek(new Date(`${request.weekStart}T00:00:00+09:00`));
    const candidates = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const day = addMinutes(weekStart, dayOffset * 24 * 60);
      for (
        let startMinute = settings.searchStartMinutes;
        startMinute + request.durationMinutes <= settings.searchEndMinutes;
        startMinute += settings.intervalMinutes
      ) {
        const start = addMinutes(day, startMinute);
        const end = addMinutes(start, request.durationMinutes);
        candidates.push({ start, end, mode: request.mode });
      }
    }
    return candidates;
  }

  function participantState(participant, candidate, busyBlocks) {
    const conflicts = busyBlocks.filter(
      (block) =>
        block.participantId === participant.id &&
        overlaps(candidate.start, candidate.end, block.start, block.end),
    );

    if (conflicts.length === 0) {
      return { participant, status: STATUS.AVAILABLE, conflicts: [] };
    }

    const canAdjust = conflicts.every((conflict) => conflict.status === STATUS.ADJUSTABLE);
    return {
      participant,
      status: canAdjust ? STATUS.ADJUSTABLE : STATUS.UNAVAILABLE,
      conflicts,
    };
  }

  function overlapRatio(candidate, preferredStartMinutes, preferredEndMinutes) {
    const startMinutes = candidate.start.getHours() * 60 + candidate.start.getMinutes();
    const endMinutes = startMinutes + (candidate.end.getTime() - candidate.start.getTime()) / 60000;
    const overlapMinutes = Math.max(
      0,
      Math.min(endMinutes, preferredEndMinutes) - Math.max(startMinutes, preferredStartMinutes),
    );
    return Math.min(1, overlapMinutes / Math.max(1, endMinutes - startMinutes));
  }

  function preferenceScore(candidate, preferences) {
    const weekdayMatch = preferences.preferredWeekdays.includes(candidate.start.getDay()) ? 1 : 0;
    const timeMatch = overlapRatio(
      candidate,
      preferences.preferredStartMinutes,
      preferences.preferredEndMinutes,
    );
    const modeMatch = preferences.preferredMode === candidate.mode ? 1 : 0;
    return Number((0.45 * weekdayMatch + 0.35 * timeMatch + 0.2 * modeMatch).toFixed(4));
  }

  function resultStatus(metrics) {
    if (metrics.everyoneAvailable) return RESULT_STATUS.ALL_AVAILABLE;
    if (metrics.everyoneCanAttend) return RESULT_STATUS.ADJUSTMENT_REQUIRED;
    if (metrics.requiredMissing > 0) return RESULT_STATUS.REQUIRED_MEMBER_MISSING;
    return RESULT_STATUS.PARTIAL_ATTENDANCE;
  }

  function reasonFor(metrics, participantCount) {
    if (metrics.everyoneAvailable) {
      return metrics.preferenceScore >= 0.8
        ? "전원이 바로 참석 가능하며 그룹의 선호 요일·시간·진행 방식과 일치합니다."
        : "전원이 바로 참석 가능한 후보 중 가장 선호도가 높은 시간입니다.";
    }
    if (metrics.everyoneCanAttend) {
      return `전원이 참석할 수 있는 후보 중 일정 조정이 필요한 인원이 ${metrics.adjustableCount}명으로 가장 적습니다.`;
    }
    if (metrics.requiredMissing > 0) {
      return `전원 참석이 불가능하여 필수 참석자 ${metrics.requiredCanAttend}명과 전체 ${metrics.canAttendCount}/${participantCount}명이 참석 가능한 시간을 선택했습니다.`;
    }
    return `전원 참석이 불가능하여 필수 참석자 전원과 전체 ${metrics.canAttendCount}/${participantCount}명이 참석 가능한 시간을 선택했습니다.`;
  }

  function evaluateCandidate(candidate, participants, busyBlocks, preferences) {
    const members = participants.map((participant) => participantState(participant, candidate, busyBlocks));
    const available = members.filter((member) => member.status === STATUS.AVAILABLE);
    const adjustable = members.filter((member) => member.status === STATUS.ADJUSTABLE);
    const unavailable = members.filter((member) => member.status === STATUS.UNAVAILABLE);
    const required = members.filter((member) => member.participant.required);
    const general = members.filter((member) => !member.participant.required);
    const requiredCanAttend = required.filter((member) => member.status !== STATUS.UNAVAILABLE).length;
    const generalCanAttend = general.filter((member) => member.status !== STATUS.UNAVAILABLE).length;
    const requiredAdjustments = required.filter((member) => member.status === STATUS.ADJUSTABLE).length;
    const generalAdjustments = general.filter((member) => member.status === STATUS.ADJUSTABLE).length;
    const metrics = {
      everyoneAvailable: available.length === participants.length,
      everyoneCanAttend: unavailable.length === 0,
      requiredCanAttend,
      generalCanAttend,
      requiredAdjustments,
      generalAdjustments,
      requiredMissing: required.length - requiredCanAttend,
      canAttendCount: requiredCanAttend + generalCanAttend,
      adjustableCount: adjustable.length,
      preferenceScore: preferenceScore(candidate, preferences),
    };

    return {
      ...candidate,
      members,
      availableParticipants: available.map((member) => member.participant),
      adjustableParticipants: adjustable.map((member) => member.participant),
      unavailableParticipants: unavailable.map((member) => member.participant),
      metrics,
      status: resultStatus(metrics),
      reason: reasonFor(metrics, participants.length),
      vector: [
        metrics.everyoneAvailable ? 1 : 0,
        metrics.everyoneCanAttend ? 1 : 0,
        metrics.requiredCanAttend,
        metrics.generalCanAttend,
        -metrics.requiredAdjustments,
        -metrics.generalAdjustments,
        metrics.preferenceScore,
      ],
    };
  }

  function compareEvaluations(left, right) {
    for (let index = 0; index < left.vector.length; index += 1) {
      if (left.vector[index] !== right.vector[index]) {
        return right.vector[index] - left.vector[index];
      }
    }

    const leftMinutes = left.start.getHours() * 60 + left.start.getMinutes();
    const rightMinutes = right.start.getHours() * 60 + right.start.getMinutes();
    if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
    return left.start.getTime() - right.start.getTime();
  }

  function notificationData(evaluation) {
    const details = (memberState) => ({
      participantId: memberState.participant.id,
      participantName: memberState.participant.name,
      conflicts: memberState.conflicts.map((conflict) => ({
        conflictEventId: conflict.eventId,
        conflictTitle: conflict.title,
        conflictStart: conflict.start.toISOString(),
        conflictEnd: conflict.end.toISOString(),
      })),
    });

    return {
      adjustmentRequired: evaluation.members
        .filter((member) => member.status === STATUS.ADJUSTABLE)
        .map(details),
      unavailable: evaluation.members
        .filter((member) => member.status === STATUS.UNAVAILABLE)
        .map(details),
    };
  }

  function selectAlternatives(ranked, confirmed, count) {
    const missingIds = new Set(confirmed.unavailableParticipants.map((participant) => participant.id));
    const pool = ranked.filter((candidate) => candidate.start.getTime() !== confirmed.start.getTime());
    const selected = [];

    while (selected.length < count && pool.length > 0) {
      pool.sort((left, right) => {
        const leftCoverage = left.members.filter(
          (member) => missingIds.has(member.participant.id) && member.status !== STATUS.UNAVAILABLE,
        ).length;
        const rightCoverage = right.members.filter(
          (member) => missingIds.has(member.participant.id) && member.status !== STATUS.UNAVAILABLE,
        ).length;
        if (leftCoverage !== rightCoverage) return rightCoverage - leftCoverage;

        const usedDates = new Set([confirmed, ...selected].map((item) => item.start.toDateString()));
        const leftNewDate = usedDates.has(left.start.toDateString()) ? 0 : 1;
        const rightNewDate = usedDates.has(right.start.toDateString()) ? 0 : 1;
        if (leftNewDate !== rightNewDate) return rightNewDate - leftNewDate;
        return compareEvaluations(left, right);
      });
      selected.push(pool.shift());
    }

    return selected;
  }

  function optimizeMeeting(input) {
    if (!input.participants || input.participants.length === 0) {
      throw new Error("참석자가 한 명 이상 필요합니다.");
    }
    if (!input.request || !input.request.weekStart || !input.request.durationMinutes) {
      throw new Error("원하는 주와 회의 소요 시간을 입력해 주세요.");
    }

    const busyBlocks = normalizeBusyBlocks(input.busyBlocks || []);
    const candidates = generateCandidateSlots(input.request, input.options);
    const ranked = candidates
      .map((candidate) =>
        evaluateCandidate(candidate, input.participants, busyBlocks, input.groupPreferences),
      )
      .sort(compareEvaluations);
    const confirmed = ranked[0];

    return {
      confirmedSlot: confirmed,
      alternativeSlots: selectAlternatives(ranked, confirmed, 2),
      notifications: notificationData(confirmed),
      evaluatedCandidateCount: ranked.length,
      timezone: (input.options && input.options.timezone) || DEFAULTS.timezone,
    };
  }

  const api = {
    STATUS,
    RESULT_STATUS,
    DEFAULTS,
    generateCandidateSlots,
    evaluateCandidate,
    compareEvaluations,
    optimizeMeeting,
  };

  globalScope.FeetScheduler = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
