const calendarDays = [
  { day: "월", date: "17", dateKey: "2026-08-17" },
  { day: "화", date: "18", dateKey: "2026-08-18" },
  { day: "수", date: "19", dateKey: "2026-08-19" },
  { day: "목", date: "20", dateKey: "2026-08-20" },
  { day: "금", date: "21", dateKey: "2026-08-21" },
  { day: "토", date: "22", dateKey: "2026-08-22" },
  { day: "일", date: "23", dateKey: "2026-08-23" },
];

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

const baseEvents = [
  { id: "mentor", date: "2026-08-17", startTime: "11:00", endTime: "12:00", title: "멘토링", source: "google", group: "개인", people: "나", importance: "보통" },
  { id: "sprint-planning", date: "2026-08-18", startTime: "10:30", endTime: "11:30", title: "팀 스프린트", source: "feet", group: "해커톤 팀", people: "5명", importance: "높음", mode: "비대면" },
  { id: "design-review", date: "2026-08-19", startTime: "13:30", endTime: "14:30", title: "디자인 리뷰", source: "feet", group: "디자인 스터디", people: "4명", importance: "높음", mode: "대면" },
  { id: "class", date: "2026-08-20", startTime: "10:00", endTime: "11:00", title: "수업", source: "google", group: "개인", people: "나", importance: "보통" },
  { id: "hackathon-sprint", date: "2026-08-20", startTime: "16:00", endTime: "17:00", title: "해커톤 팀 스프린트", source: "feet", group: "해커톤 팀", people: "5명", importance: "매우 높음", mode: "비대면" },
  { id: "study", date: "2026-08-22", startTime: "13:00", endTime: "14:00", title: "주말 스터디", source: "feet", group: "프로젝트 멘토링", people: "3명", importance: "보통", mode: "비대면" },
  { id: "workout", date: "2026-08-23", startTime: "10:00", endTime: "11:00", title: "운동", source: "google", group: "개인", people: "나", importance: "낮음" },
];

const GROUP_STORAGE_KEY = "feetUserGroups";
const JOIN_CODE_PATTERN = /^[A-Z]{5}[0-9]{5}$/;
const DEMO_JOIN_GROUPS = {
  FEATY20268: {
    id: "ai-scheduling-demo-team",
    name: "AI 스케줄링 데모 팀",
    description: "함께 가능한 시간을 넘어 최적의 회의 시간을 찾는 데모 그룹입니다.",
    memberCount: 5,
    source: "joined",
  },
};

const calendar = document.getElementById("weekly-calendar");
const eventDialog = document.getElementById("event-dialog");
const eventDetail = document.getElementById("event-detail");
const eventSource = document.getElementById("event-source");
const monthDialog = document.getElementById("month-calendar-dialog");
const monthGrid = document.getElementById("month-calendar-grid");
const monthLabel = document.getElementById("month-calendar-label");
const toast = document.getElementById("toast");
const demoYear = 2026;
const demoMonth = 7;
let visibleMonth = new Date(demoYear, demoMonth, 1);
let toastTimer;

function readUserGroups() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(GROUP_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function storeUserGroups(groups) {
  window.localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groups));
}

function normalizeJoinCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

function secureIndex(size) {
  const values = new Uint32Array(1);
  const unbiasedLimit = Math.floor(0x100000000 / size) * size;
  do window.crypto.getRandomValues(values);
  while (values[0] >= unbiasedLimit);
  return values[0] % size;
}

function generateJoinCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let code = "";
  for (let index = 0; index < 5; index += 1) code += alphabet[secureIndex(alphabet.length)];
  for (let index = 0; index < 5; index += 1) code += digits[secureIndex(digits.length)];
  return code;
}

function groupUrl(group) {
  const url = new URL("./group.html", window.location.href);
  url.searchParams.set("groupId", group.id);
  return url.href;
}

function appendGroupCard(group) {
  const list = document.querySelector(".group-list");
  if (!list || list.querySelector(`[data-group-id="${group.id}"]`)) return;

  const card = document.createElement("a");
  const icon = document.createElement("span");
  const copy = document.createElement("span");
  const name = document.createElement("strong");
  const detail = document.createElement("small");
  const arrow = document.createElement("span");

  card.className = "group-card";
  card.href = groupUrl(group);
  card.dataset.groupId = group.id;
  card.setAttribute("aria-label", `${group.name} 그룹 홈으로 이동`);
  icon.className = "group-icon group-icon--indigo";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = group.name.slice(0, 1).toUpperCase();
  copy.className = "group-copy";
  name.textContent = group.name;
  detail.textContent = `${group.memberCount}명 · 최적 회의 시간 찾기`;
  copy.append(name, detail);
  arrow.className = "arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  card.append(icon, copy, arrow);
  list.append(card);
}

function renderUserGroups() {
  const groups = readUserGroups();
  groups.forEach(appendGroupCard);
  const count = document.querySelector(".group-count");
  if (count) count.textContent = String(3 + groups.length);
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timeKey(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function readStoredMeetings() {
  const query = new URLSearchParams(window.location.search);
  const queryMeeting = query.get("meetingStart")
    ? [{
        title: query.get("meetingTitle") || "새 그룹 회의",
        start: query.get("meetingStart"),
        end: query.get("meetingEnd"),
        mode: query.get("meetingMode") || "online",
        groupId: query.get("meetingGroupId") || "hackathon-team",
        groupName: query.get("meetingGroup") || "해커톤 팀",
        participantCount: Number(query.get("meetingParticipants")) || 5,
      }]
    : [];

  let stored = [];
  try {
    stored = JSON.parse(window.localStorage.getItem("feetConfirmedMeetings") || "[]");
  } catch {
    stored = [];
  }

  const byStart = new Map([...stored, ...queryMeeting].filter((meeting) => meeting.start).map((meeting) => [meeting.start, meeting]));
  const meetings = [...byStart.values()];
  try {
    window.localStorage.setItem("feetConfirmedMeetings", JSON.stringify(meetings));
  } catch {
    // The query-string handoff still keeps the static file demo connected.
  }

  return meetings.map((meeting, index) => {
    const start = new Date(meeting.start);
    const end = new Date(meeting.end);
    return {
      id: `confirmed-group-${index}-${start.getTime()}`,
      date: dateKey(start),
      startTime: timeKey(start),
      endTime: timeKey(end),
      title: meeting.title,
      source: "feet",
      group: meeting.groupName || "해커톤 팀",
      people: `${meeting.participantCount || 5}명`,
      importance: "높음",
      mode: meeting.mode === "in_person" ? "대면" : "비대면",
      createdFromGroup: true,
    };
  });
}

const savedMeetingEvents = readStoredMeetings();
const events = [...baseEvents, ...savedMeetingEvents];

function eventGridPosition(event) {
  const dayIndex = calendarDays.findIndex((day) => day.dateKey === event.date);
  const eventHour = `${event.startTime.slice(0, 2)}:00`;
  const startIndex = timeSlots.indexOf(eventHour);
  const start = new Date(`${event.date}T${event.startTime}:00+09:00`);
  const end = new Date(`${event.date}T${event.endTime}:00+09:00`);
  const length = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 3600000));
  return { dayIndex, startIndex, length };
}

function renderCalendar() {
  const timeColumn = document.createElement("div");
  timeColumn.className = "time-column";
  timeColumn.innerHTML = '<div class="time-corner" aria-hidden="true"></div>';
  timeSlots.forEach((time) => {
    const label = document.createElement("div");
    label.className = "time-label";
    label.textContent = time;
    timeColumn.append(label);
  });
  calendar.append(timeColumn);

  calendarDays.forEach((day, dayIndex) => {
    const dayColumn = document.createElement("section");
    dayColumn.className = "calendar-day";
    dayColumn.setAttribute("role", "gridcell");
    dayColumn.innerHTML = `<div class="day-header">${day.day}<span>${day.date}일</span></div>`;

    const track = document.createElement("div");
    track.className = "day-track";
    track.setAttribute("aria-label", `${day.day}요일 ${day.date}일 일정`);

    events.forEach((event) => {
      const position = eventGridPosition(event);
      if (position.dayIndex !== dayIndex || position.startIndex < 0) return;
      const eventButton = document.createElement("button");
      eventButton.type = "button";
      eventButton.className = `calendar-event calendar-event--${event.source}${event.createdFromGroup ? " calendar-event--new" : ""}`;
      eventButton.style.gridRow = `${position.startIndex + 1} / span ${position.length}`;
      eventButton.dataset.eventId = event.id;
      eventButton.setAttribute("aria-label", `${event.title}, ${event.startTime}–${event.endTime}, 상세 보기`);
      const title = document.createTextNode(event.title);
      const time = document.createElement("span");
      time.className = "calendar-event-time";
      time.textContent = `${event.startTime}–${event.endTime}`;
      eventButton.append(title, time);
      track.append(eventButton);
    });

    dayColumn.append(track);
    calendar.append(dayColumn);
  });
}

function appendDetail(label, value, list) {
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value;
  list.append(term, description);
}

function openEvent(eventId) {
  const event = events.find((item) => item.id === eventId);
  if (!event) return;
  if (monthDialog.open) monthDialog.close();
  eventSource.textContent = event.source === "feet" ? "MATCHU CONFIRMED MEETING" : "GOOGLE CALENDAR";
  eventDetail.replaceChildren();
  const title = document.createElement("h3");
  title.textContent = event.title;
  const list = document.createElement("dl");
  appendDetail("시간", `${event.date} · ${event.startTime}–${event.endTime}`, list);
  appendDetail("그룹", event.group, list);
  appendDetail("참석자", event.people, list);
  appendDetail("회의 중요도", event.importance, list);
  if (event.mode) appendDetail("진행 방식", event.mode, list);
  eventDetail.append(title, list);
  eventDialog.showModal();
}

function getEventsForDate(year, month, date) {
  const target = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
  return events.filter((event) => event.date === target);
}

function createMonthDay(date, displayMonth, isOutside, weekday) {
  const cell = document.createElement("div");
  const isToday = displayMonth === demoMonth && date === 12 && visibleMonth.getFullYear() === demoYear;
  cell.className = `month-day${isOutside ? " month-day--outside" : ""}${weekday === 0 ? " month-day--sunday" : ""}${weekday === 6 ? " month-day--saturday" : ""}${isToday ? " month-day--today" : ""}`;
  cell.setAttribute("role", "gridcell");
  const number = document.createElement("span");
  number.className = "month-day-number";
  number.textContent = date;
  cell.append(number);

  const list = document.createElement("div");
  list.className = "month-events";
  if (!isOutside) {
    getEventsForDate(visibleMonth.getFullYear(), displayMonth, date).forEach((event) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `month-event month-event--${event.source}`;
      button.dataset.eventId = event.id;
      button.textContent = `${event.startTime} ${event.title}`;
      button.setAttribute("aria-label", `${event.title}, ${event.startTime}–${event.endTime}, 상세 보기`);
      list.append(button);
    });
  }
  cell.append(list);
  return cell;
}

function renderMonthCalendar() {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  monthLabel.textContent = `${year}년 ${month + 1}월`;
  monthGrid.setAttribute("aria-label", `${year}년 ${month + 1}월 월간 일정`);
  monthGrid.replaceChildren();

  for (let index = 0; index < 42; index += 1) {
    const calendarDate = index - firstWeekday + 1;
    if (calendarDate < 1) monthGrid.append(createMonthDay(daysInPreviousMonth + calendarDate, month - 1, true, index % 7));
    else if (calendarDate > daysInMonth) monthGrid.append(createMonthDay(calendarDate - daysInMonth, month + 1, true, index % 7));
    else monthGrid.append(createMonthDay(calendarDate, month, false, index % 7));
  }
}

function updateNextMeeting() {
  const feetEvents = (savedMeetingEvents.length ? savedMeetingEvents : events.filter((event) => event.source === "feet"))
    .slice()
    .sort((left, right) => `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`));
  const next = feetEvents[0];
  if (!next) return;
  const date = new Date(`${next.date}T00:00:00+09:00`);
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "long", timeZone: "Asia/Seoul" }).format(date);
  document.getElementById("next-meeting-title").textContent = next.title;
  document.getElementById("next-meeting-time").textContent = `${weekday} · ${next.startTime}–${next.endTime}`;
  document.querySelector(".next-meeting-link").dataset.eventId = next.id;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

renderCalendar();
renderMonthCalendar();
updateNextMeeting();
renderUserGroups();

document.getElementById("scroll-calendar-left").addEventListener("click", () => document.getElementById("calendar-viewport").scrollBy({ left: -420, behavior: "smooth" }));
document.getElementById("scroll-calendar-right").addEventListener("click", () => document.getElementById("calendar-viewport").scrollBy({ left: 420, behavior: "smooth" }));
document.getElementById("previous-month").addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1); renderMonthCalendar(); });
document.getElementById("next-month").addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1); renderMonthCalendar(); });
document.getElementById("month-today").addEventListener("click", () => { visibleMonth = new Date(demoYear, demoMonth, 1); renderMonthCalendar(); });

document.addEventListener("click", (event) => {
  const eventButton = event.target.closest("[data-event-id]");
  if (eventButton) openEvent(eventButton.dataset.eventId);
  const openDialogButton = event.target.closest("[data-open-dialog]");
  if (openDialogButton) document.getElementById(openDialogButton.dataset.openDialog).showModal();
  const closeButton = event.target.closest("[data-close-dialog]");
  if (closeButton) closeButton.closest("dialog").close();
  const toastButton = event.target.closest("[data-show-toast]");
  if (toastButton) showToast(toastButton.dataset.showToast);
  if (event.target.matches("dialog")) event.target.close();
});

const createGroupForm = document.querySelector("#create-group-form");
const createGroupName = document.querySelector("#create-group-name");
const createGroupDescription = document.querySelector("#create-group-description");
const inviteCodeResult = document.querySelector("#invite-code-result");
const createdInviteCode = document.querySelector("#created-invite-code");
const openCreatedGroup = document.querySelector("#open-created-group");

createGroupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = createGroupName.value.trim();
  if (!name) return;

  const groups = readUserGroups();
  let code = generateJoinCode();
  while (groups.some((group) => group.joinCode === code)) code = generateJoinCode();
  const group = {
    id: `group-${Date.now().toString(36)}`,
    name,
    description: createGroupDescription.value.trim() || "새로운 그룹의 최적 회의 시간을 함께 찾아보세요.",
    memberCount: 1,
    joinCode: code,
    source: "created",
  };
  groups.push(group);
  storeUserGroups(groups);
  appendGroupCard(group);
  document.querySelector(".group-count").textContent = String(3 + groups.length);
  createdInviteCode.textContent = code;
  openCreatedGroup.href = groupUrl(group);
  inviteCodeResult.hidden = false;
  showToast(`${name} 그룹과 참여 코드를 만들었어요.`);
});

document.querySelector("#copy-invite-code").addEventListener("click", async () => {
  const code = createdInviteCode.textContent;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    showToast("참여 코드를 복사했어요.");
  } catch {
    showToast(`참여 코드: ${code}`);
  }
});

const joinGroupForm = document.querySelector("#join-group-form");
const joinCodeInput = document.querySelector("#join-code");
const joinCodeFeedback = document.querySelector("#join-code-feedback");

joinCodeInput.addEventListener("input", () => {
  joinCodeInput.value = normalizeJoinCode(joinCodeInput.value);
  joinCodeInput.removeAttribute("aria-invalid");
  joinCodeFeedback.textContent = "";
});

document.querySelector("#fill-demo-code").addEventListener("click", () => {
  joinCodeInput.value = "FEATY20268";
  joinCodeInput.dispatchEvent(new Event("input"));
  joinCodeInput.focus();
});

joinGroupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = normalizeJoinCode(joinCodeInput.value);
  if (!JOIN_CODE_PATTERN.test(code)) {
    joinCodeInput.setAttribute("aria-invalid", "true");
    joinCodeFeedback.textContent = "영문 5자 뒤에 숫자 5자를 입력해 주세요.";
    joinCodeInput.focus();
    return;
  }

  const groups = readUserGroups();
  const createdGroup = groups.find((group) => group.joinCode === code);
  const target = createdGroup || DEMO_JOIN_GROUPS[code];
  if (!target) {
    joinCodeInput.setAttribute("aria-invalid", "true");
    joinCodeFeedback.textContent = "유효하지 않거나 만료된 참여 코드입니다.";
    return;
  }

  const existing = groups.find((group) => group.id === target.id);
  if (!existing) {
    groups.push(target);
    storeUserGroups(groups);
    appendGroupCard(target);
    document.querySelector(".group-count").textContent = String(3 + groups.length);
  }

  showToast(existing ? "이미 참여 중인 그룹이에요." : `${target.name}에 참여했어요.`);
  window.setTimeout(() => { window.location.href = groupUrl(target); }, 450);
});

document.querySelector("[data-open-profile]").addEventListener("click", () => showToast("프로필 설정 화면은 Google 계정 정보와 연결될 예정이에요."));
