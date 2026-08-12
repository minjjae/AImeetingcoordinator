(function initializeGroupPage() {
  "use strict";

  const participants = [
    { id: "minjae", name: "김민재", required: true },
    { id: "jisoo", name: "박지수", required: false },
    { id: "seoyeon", name: "이서연", required: false },
    { id: "junho", name: "최준호", required: false },
    { id: "yuna", name: "정유나", required: false },
  ];

  const groupPreferences = {
    preferredWeekdays: [3],
    preferredStartMinutes: 21 * 60,
    preferredEndMinutes: 22 * 60,
    preferredMode: "online",
  };

  const scheduler = window.FeetScheduler;
  const sidebar = document.querySelector("#group-sidebar");
  const scrim = document.querySelector("#sidebar-scrim");
  const createModal = document.querySelector("#create-meeting-modal");
  const meetingForm = document.querySelector("#meeting-form");
  const resultSection = document.querySelector("#optimization-result");
  const calendarGrid = document.querySelector("#group-month-grid");
  const calendarLabel = document.querySelector("#group-calendar-label");
  const monthEmpty = document.querySelector("#month-empty-state");
  let calendarMonth = new Date(2026, 7, 1);
  let confirmedMeetings = readConfirmedMeetings();
  let lastFocusedElement = null;

  function readConfirmedMeetings() {
    try {
      const stored = JSON.parse(window.localStorage.getItem("feetConfirmedMeetings") || "[]");
      return stored.map((meeting) => ({
        ...meeting,
        start: new Date(meeting.start),
        end: new Date(meeting.end),
      }));
    } catch {
      return [];
    }
  }

  function storeConfirmedMeetings() {
    try {
      window.localStorage.setItem(
        "feetConfirmedMeetings",
        JSON.stringify(confirmedMeetings.map((meeting) => ({
          ...meeting,
          start: meeting.start.toISOString(),
          end: meeting.end.toISOString(),
        }))),
      );
    } catch {
      // Query-string handoff below keeps file:// demos connected.
    }
  }

  function updatePersonalLinks(meeting) {
    const target = new URL("./personal.html", window.location.href);
    if (meeting) {
      target.searchParams.set("meetingTitle", meeting.title);
      target.searchParams.set("meetingStart", meeting.start.toISOString());
      target.searchParams.set("meetingEnd", meeting.end.toISOString());
      target.searchParams.set("meetingMode", meeting.mode);
    }
    document.querySelectorAll("[data-personal-link]").forEach((link) => {
      link.href = target.href;
    });
  }

  function openMenu() {
    sidebar.classList.add("is-open");
    scrim.classList.add("is-visible");
  }

  function closeMenu() {
    sidebar.classList.remove("is-open");
    scrim.classList.remove("is-visible");
  }

  function openCreateModal() {
    lastFocusedElement = document.activeElement;
    createModal.hidden = false;
    document.body.classList.add("modal-open");
    document.querySelector("#meeting-title").focus();
  }

  function closeCreateModal() {
    createModal.hidden = true;
    document.body.classList.remove("modal-open");
    lastFocusedElement?.focus();
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "long",
      timeZone: "Asia/Seoul",
    }).format(date);
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Seoul",
    }).format(date);
  }

  function statusLabel(status) {
    return {
      ALL_AVAILABLE: "전원 참석 가능",
      ADJUSTMENT_REQUIRED: "일정 조정 필요",
      PARTIAL_ATTENDANCE: "일부 참석",
      REQUIRED_MEMBER_MISSING: "필수 참석자 불참",
    }[status];
  }

  function formatMemberList(members) {
    return members.length ? members.map((member) => member.name).join(", ") : "없음";
  }

  function renderAlternatives(alternatives) {
    return alternatives
      .map(
        (slot) => `
          <li>
            <strong>${formatDate(slot.start)} ${formatTime(slot.start)}–${formatTime(slot.end)}</strong>
            <span>${slot.metrics.canAttendCount}/${participants.length}명 참석 가능 · ${statusLabel(slot.status)}</span>
          </li>`,
      )
      .join("");
  }

  function renderResult(meeting, result) {
    const slot = result.confirmedSlot;
    const notificationCount =
      result.notifications.adjustmentRequired.length + result.notifications.unavailable.length;

    document.querySelector("#result-status").textContent = statusLabel(slot.status);
    document.querySelector("#result-title").textContent = meeting.title;
    document.querySelector("#result-datetime").textContent = `${formatDate(slot.start)} · ${formatTime(slot.start)}–${formatTime(slot.end)}`;
    document.querySelector("#result-mode").textContent = meeting.mode === "online" ? "비대면" : "대면";
    document.querySelector("#result-reason").textContent = slot.reason;
    document.querySelector("#result-available").textContent = formatMemberList(slot.availableParticipants);
    document.querySelector("#result-adjustable").textContent = formatMemberList(slot.adjustableParticipants);
    document.querySelector("#result-unavailable").textContent = formatMemberList(slot.unavailableParticipants);
    document.querySelector("#result-candidate-count").textContent = `${result.evaluatedCandidateCount}개 후보 비교`;
    document.querySelector("#result-alternatives").innerHTML = renderAlternatives(result.alternativeSlots);
    document.querySelector("#email-connection-note").textContent = notificationCount
      ? `${notificationCount}명에게 보낼 맞춤 알림 데이터 준비 완료 · 이메일 API 연결 대기`
      : "전체 멤버용 회의 안내 데이터 준비 완료 · 이메일 API 연결 대기";
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function calendarEventsForDate(year, month, date) {
    return confirmedMeetings.filter(
      (meeting) =>
        meeting.start.getFullYear() === year &&
        meeting.start.getMonth() === month &&
        meeting.start.getDate() === date,
    );
  }

  function renderMonthCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();
    calendarLabel.textContent = `${year}년 ${month + 1}월`;
    calendarGrid.replaceChildren();

    for (let index = 0; index < 42; index += 1) {
      const rawDate = index - firstWeekday + 1;
      const outsideBefore = rawDate < 1;
      const outsideAfter = rawDate > daysInMonth;
      const date = outsideBefore
        ? previousMonthDays + rawDate
        : outsideAfter
          ? rawDate - daysInMonth
          : rawDate;
      const cell = document.createElement("div");
      cell.className = `group-month-day${outsideBefore || outsideAfter ? " is-outside" : ""}${index % 7 === 0 ? " is-sunday" : ""}${index % 7 === 6 ? " is-saturday" : ""}`;
      cell.setAttribute("role", "gridcell");
      const number = document.createElement("span");
      number.className = "group-month-day__number";
      number.textContent = String(date);
      cell.append(number);

      if (!outsideBefore && !outsideAfter) {
        calendarEventsForDate(year, month, date).forEach((meeting) => {
          const event = document.createElement("button");
          event.className = "group-month-event";
          event.type = "button";
          event.innerHTML = `<strong>${formatTime(meeting.start)}</strong><span>${meeting.title}</span>`;
          event.setAttribute("aria-label", `${meeting.title}, ${formatTime(meeting.start)}, ${meeting.mode === "online" ? "비대면" : "대면"}`);
          event.addEventListener("click", () => resultSection.scrollIntoView({ behavior: "smooth", block: "start" }));
          cell.append(event);
        });
      }
      calendarGrid.append(cell);
    }
    monthEmpty.hidden = confirmedMeetings.some(
      (meeting) => meeting.start.getFullYear() === year && meeting.start.getMonth() === month,
    );
  }

  function requiredParticipantsFromForm(formData) {
    const requiredIds = new Set(formData.getAll("requiredParticipants"));
    return participants.map((participant) => ({
      ...participant,
      required: requiredIds.has(participant.id),
    }));
  }

  async function createMeeting(event) {
    event.preventDefault();
    const formData = new FormData(meetingForm);
    const submitButton = meetingForm.querySelector('button[type="submit"]');
    const formError = document.querySelector("#meeting-form-error");
    const meeting = {
      title: String(formData.get("title")),
      description: String(formData.get("description") || ""),
      weekStart: String(formData.get("weekStart")),
      durationMinutes: Number(formData.get("durationMinutes")),
      mode: String(formData.get("mode")),
    };

    formError.hidden = true;
    submitButton.disabled = true;
    submitButton.textContent = "멤버 일정 계산 중…";
    try {
      const meetingParticipants = requiredParticipantsFromForm(formData);
      const busyBlocks = await window.FeetCalendarAdapter.getGroupBusyBlocks({
        weekStart: meeting.weekStart,
        participantIds: meetingParticipants.map((participant) => participant.id),
      });
      const result = scheduler.optimizeMeeting({
        participants: meetingParticipants,
        busyBlocks,
        request: meeting,
        groupPreferences,
        options: { timezone: "Asia/Seoul" },
      });

      confirmedMeetings = [
        ...confirmedMeetings,
        {
          ...meeting,
          start: result.confirmedSlot.start,
          end: result.confirmedSlot.end,
          status: result.confirmedSlot.status,
        },
      ];
      storeConfirmedMeetings();
      updatePersonalLinks(confirmedMeetings.at(-1));
      calendarMonth = new Date(result.confirmedSlot.start.getFullYear(), result.confirmedSlot.start.getMonth(), 1);
      renderMonthCalendar();
      renderResult(meeting, result);
      closeCreateModal();
    } catch (error) {
      formError.textContent = error instanceof Error
        ? error.message
        : "멤버 일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
      formError.hidden = false;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "최적 시간 계산하고 확정";
    }
  }

  document.querySelector("#mobile-open").addEventListener("click", openMenu);
  document.querySelector("#mobile-close").addEventListener("click", closeMenu);
  scrim.addEventListener("click", closeMenu);
  document.querySelectorAll("[data-open-meeting-form]").forEach((button) => button.addEventListener("click", openCreateModal));
  document.querySelectorAll("[data-close-meeting-form]").forEach((button) => button.addEventListener("click", closeCreateModal));
  meetingForm.addEventListener("submit", createMeeting);

  document.querySelector("#previous-group-month").addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderMonthCalendar();
  });
  document.querySelector("#next-group-month").addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderMonthCalendar();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!createModal.hidden) closeCreateModal();
    else closeMenu();
  });

  updatePersonalLinks(confirmedMeetings.at(-1));
  renderMonthCalendar();
})();
