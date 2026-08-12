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
      group: "해커톤 팀",
      people: "5명",
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

document.querySelectorAll("[data-demo-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showToast(form.dataset.demoForm);
    form.closest("dialog").close();
    form.reset();
  });
});

document.querySelector("[data-open-profile]").addEventListener("click", () => showToast("프로필 설정 화면은 Google 계정 정보와 연결될 예정이에요."));
