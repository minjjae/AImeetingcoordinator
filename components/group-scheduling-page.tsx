"use client";

import {
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MailCheck,
  Menu,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Star,
  Target,
  UserRound,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calendarDays, calendarTimes } from "@/lib/group-data";
import type { AvailabilitySlot, CandidateSlot, Group, Member } from "@/lib/types";

type GroupSchedulingPageProps = {
  group: Group;
  slots: AvailabilitySlot[];
  candidates: CandidateSlot[];
};

type ExplanationState =
  | { status: "idle" | "loading"; text?: never }
  | { status: "success"; text: string }
  | { status: "error"; text: string };

function Avatar({ member, small = false }: { member: Member; small?: boolean }) {
  return (
    <span
      className={`avatar${small ? " avatar-small" : ""}`}
      style={{ backgroundColor: member.avatarColor }}
      aria-hidden="true"
    >
      {member.initials}
    </span>
  );
}

function formatRange(candidate: CandidateSlot) {
  const format = (value: string) => {
    const hour = Number(value.slice(0, 2));
    return `${hour > 12 ? hour - 12 : hour}:00`;
  };
  return `${format(candidate.time)}–${format(candidate.endTime)} ${Number(candidate.time.slice(0, 2)) >= 12 ? "PM" : "AM"}`;
}

function scoreTone(count: number) {
  if (count === 5) return "density-full";
  if (count === 4) return "density-high";
  if (count === 3) return "density-medium";
  return "density-low";
}

export function GroupSchedulingPage({ group, slots, candidates }: GroupSchedulingPageProps) {
  const [selectedSlotId, setSelectedSlotId] = useState(candidates[0].id);
  const [recommendationsVisible, setRecommendationsVisible] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationState>({ status: "idle" });
  const [pendingCandidate, setPendingCandidate] = useState<CandidateSlot | null>(null);
  const [confirmationState, setConfirmationState] = useState<"ready" | "confirming" | "scheduled">("ready");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const slotsById = useMemo(() => new Map(slots.map((slot) => [slot.id, slot])), [slots]);
  const selectedSlot = slotsById.get(selectedSlotId) ?? slots[0];
  const availableMembers = group.members.filter((member) => selectedSlot.availableMemberIds.includes(member.id));
  const unavailableMembers = group.members.filter((member) => !selectedSlot.availableMemberIds.includes(member.id));

  useEffect(() => {
    if (!pendingCandidate) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && confirmationState !== "confirming") setPendingCandidate(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingCandidate, confirmationState]);

  async function loadExplanation() {
    setExplanation({ status: "loading" });
    try {
      const response = await fetch("/api/recommendation/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group: {
            name: group.name,
            averageAttendance: group.averageAttendance,
            preferredMeetingTime: group.preferredMeetingTime,
            meeting: group.meeting,
          },
          candidate: {
            day: candidates[0].dayLabel,
            time: formatRange(candidates[0]),
            available: candidates[0].availableMembers.length,
            total: group.members.length,
            unavailableMembers: candidates[0].unavailableMembers.map((member) => member.name),
            score: candidates[0].score,
            reasons: candidates[0].reasons,
          },
        }),
      });
      const data = (await response.json()) as { explanation?: string; error?: string };
      if (!response.ok || !data.explanation) {
        throw new Error(data.error || "Featy could not explain this recommendation.");
      }
      setExplanation({ status: "success", text: data.explanation });
    } catch (error) {
      setExplanation({
        status: "error",
        text: error instanceof Error ? error.message : "Featy could not explain this recommendation.",
      });
    }
  }

  function findBestTime() {
    setRecommendationsVisible(true);
    document.getElementById("recommendations")?.scrollIntoView({ behavior: "smooth", block: "start" });
    void loadExplanation();
  }

  function chooseCandidate(candidate: CandidateSlot) {
    setPendingCandidate(candidate);
    setConfirmationState("ready");
  }

  function confirmMeeting() {
    setConfirmationState("confirming");
    window.setTimeout(() => setConfirmationState("scheduled"), 700);
  }

  return (
    <div className="app-frame">
      <aside className={`sidebar${mobileNavOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>Featy</span>
          <button className="mobile-close icon-button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
            <X size={19} />
          </button>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          <Link href="#" aria-disabled="true"><LayoutDashboard size={18} />Personal</Link>
          <div className="nav-section-label"><span>Groups</span><button aria-label="Create group"><Plus size={16} /></button></div>
          <Link href="#" aria-disabled="true"><span className="group-dot design-dot" />Design Team</Link>
          <Link href="#" aria-disabled="true"><span className="group-dot engineering-dot" />Engineering</Link>
          <Link className="active" href="/group/hackathon-team"><span className="group-dot hackathon-dot" />Hackathon Team<ChevronRight size={15} /></Link>
          <button className="create-group"><Plus size={16} />Create group</button>
        </nav>

        <div className="sidebar-bottom">
          <button><Settings size={18} />Settings</button>
          <button><LogOut size={18} />Log out</button>
          <div className="profile-row">
            <span className="profile-avatar">MK</span>
            <span><strong>Minjae Kim</strong><small>minjae@featy.team</small></span>
            <ChevronRight size={15} />
          </div>
        </div>
      </aside>

      {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-content">
        <header className="mobile-header">
          <button className="icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <span className="mobile-brand"><span className="brand-mark">F</span>Featy</span>
          <span className="profile-avatar">MK</span>
        </header>

        <div className="page-content">
          <div className="breadcrumb"><span>Groups</span><ChevronRight size={14} /><strong>{group.name}</strong></div>

          <section className="group-hero" aria-labelledby="group-title">
            <div className="hero-copy">
              <p className="eyebrow">WEEKLY TEAM RHYTHM</p>
              <h1 id="group-title">{group.name}</h1>
              <p>Find the time that works for the team, not just the calendar.</p>
            </div>
            <button className="primary-button find-button" onClick={findBestTime}>
              <WandSparkles size={18} />Find best meeting time
            </button>
          </section>

          <section className="metric-strip" aria-label="Group meeting metrics">
            <div><Users size={18} /><span><strong>{group.members.length}</strong><small>Members</small></span></div>
            <div><CalendarDays size={18} /><span><strong>Weekly</strong><small>Meeting #{group.meetingCount}</small></span></div>
            <div><BarChart3 size={18} /><span><strong>{group.averageAttendance}%</strong><small>Avg. attendance</small></span></div>
            <div><Clock3 size={18} /><span><strong>{group.meeting.duration} min</strong><small>Duration</small></span></div>
            <div><Target size={18} /><span><strong>High</strong><small>Importance</small></span></div>
          </section>

          <div className="workspace-grid">
            <section className="members-panel" aria-labelledby="members-title">
              <div className="section-heading">
                <div><p className="eyebrow">TEAM CONTEXT</p><h2 id="members-title">Members</h2></div>
                <span>{group.members.length}</span>
              </div>
              <div className="member-list">
                {group.members.map((member) => (
                  <div className="member-row" key={member.id}>
                    <Avatar member={member} />
                    <div className="member-copy">
                      <div><strong>{member.name}</strong>{member.required && <span className="required-badge">Required</span>}</div>
                      <span>{member.attendanceRate}% attendance</span>
                    </div>
                    <span className={`preference-icon preference-${member.preferredTime}`} title={`${member.preferredTime} preference`}>
                      {member.preferredTime === "morning" ? "AM" : member.preferredTime === "afternoon" ? "PM" : "—"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="attendance-insight">
                <Sparkles size={17} />
                <p><strong>Attendance insight</strong>Tuesday afternoons have the strongest turnout for this team.</p>
              </div>
            </section>

            <section className="calendar-panel" aria-labelledby="calendar-title">
              <div className="section-heading calendar-heading">
                <div><p className="eyebrow">AUG 17–21, 2026</p><h2 id="calendar-title">Group availability</h2></div>
                <div className="legend" aria-label="Availability color key">
                  <span><i className="legend-high" />5/5</span><span><i className="legend-mid" />4/5</span><span><i className="legend-low" />3/5</span>
                </div>
              </div>

              <div className="calendar-and-detail">
                <div className="calendar-scroll">
                  <div className="calendar-grid" role="grid" aria-label="Weekly group availability">
                    <div className="calendar-corner" />
                    {calendarDays.map((day) => (
                      <div className="calendar-day" key={day.key} role="columnheader"><strong>{day.short}</strong><span>{day.date.replace("Aug ", "")}</span></div>
                    ))}
                    {calendarTimes.map((time) => (
                      <div className="calendar-row" key={time}>
                        <div className="calendar-time" role="rowheader">{Number(time.slice(0, 2)) > 12 ? Number(time.slice(0, 2)) - 12 : Number(time.slice(0, 2))}<small>{Number(time.slice(0, 2)) >= 12 ? "PM" : "AM"}</small></div>
                        {calendarDays.map((day) => {
                          const slot = slotsById.get(`${day.key}-${time.replace(":", "")}`)!;
                          const count = slot.availableMemberIds.length;
                          return (
                            <button
                              key={slot.id}
                              className={`availability-cell ${scoreTone(count)}${selectedSlotId === slot.id ? " selected" : ""}`}
                              onClick={() => setSelectedSlotId(slot.id)}
                              aria-label={`${day.label} ${slot.timeLabel}, ${count} of ${group.members.length} available`}
                              aria-pressed={selectedSlotId === slot.id}
                              role="gridcell"
                            >
                              <strong>{count}/{group.members.length}</strong>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="slot-detail" aria-live="polite">
                  <p className="eyebrow">SELECTED SLOT</p>
                  <h3>{selectedSlot.dayLabel}</h3>
                  <p className="slot-date">{selectedSlot.dateLabel} · {selectedSlot.timeLabel}</p>
                  <div className="availability-count"><strong>{availableMembers.length}/{group.members.length}</strong><span>available</span></div>
                  <div className="detail-members">
                    {availableMembers.map((member) => <div key={member.id}><Avatar member={member} small /><span>{member.name.split(" ")[0]}</span><Check size={15} /></div>)}
                    {unavailableMembers.map((member) => <div className="unavailable" key={member.id}><Avatar member={member} small /><span>{member.name.split(" ")[0]}</span><X size={15} /></div>)}
                  </div>
                </aside>
              </div>
            </section>
          </div>

          <section id="recommendations" className={`recommendations-section${recommendationsVisible ? " visible" : ""}`} aria-labelledby="recommendations-title">
            {!recommendationsVisible ? (
              <div className="recommendations-empty">
                <span><WandSparkles size={22} /></span>
                <div><h2>Ready to coordinate</h2><p>Featy will compare availability, preferences, attendance, and meeting load.</p></div>
                <button className="secondary-button" onClick={findBestTime}>Find best time</button>
              </div>
            ) : (
              <>
                <div className="recommendations-header">
                  <div><p className="eyebrow">RANKED FOR THIS TEAM</p><h2 id="recommendations-title">Recommended times</h2></div>
                  <p>Scored with calendar and team context</p>
                </div>
                <div className="recommendation-grid">
                  {candidates.map((candidate, index) => (
                    <article className={`recommendation-card${index === 0 ? " best-card" : ""}`} key={candidate.id}>
                      <div className="recommendation-topline">
                        {index === 0 ? <span className="best-label"><Star size={13} fill="currentColor" />Best match</span> : <span className="rank-label">Option {index + 1}</span>}
                        <span className="score"><strong>{candidate.score}</strong>/100</span>
                      </div>
                      <div className="recommendation-time">
                        <span>{candidate.dayLabel.slice(0, 3).toUpperCase()}</span>
                        <div><h3>{candidate.dayLabel}</h3><p>{formatRange(candidate)}</p></div>
                      </div>
                      <div className="attendee-summary">
                        <div className="avatar-stack">
                          {candidate.availableMembers.map((member) => <Avatar key={member.id} member={member} small />)}
                        </div>
                        <span><strong>{candidate.availableMembers.length}/{group.members.length}</strong> available</span>
                      </div>
                      <ul className="reason-list">
                        {candidate.reasons.slice(0, 2).map((reason) => <li key={reason}><CheckCircle2 size={15} />{reason}</li>)}
                        {candidate.unavailableMembers.length > 0 && <li className="conflict-reason"><UserRound size={15} />{candidate.unavailableMembers.map((member) => member.name.split(" ")[0]).join(", ")} unavailable</li>}
                      </ul>
                      <button className={index === 0 ? "primary-button" : "secondary-button"} onClick={() => chooseCandidate(candidate)}>
                        Select time<ChevronRight size={16} />
                      </button>
                    </article>
                  ))}
                </div>

                <div className="ai-explanation">
                  <div className="ai-icon"><Sparkles size={21} /></div>
                  <div className="ai-copy">
                    <div><p className="eyebrow">FEATY REASONING</p><h3>Why Tuesday at 2 PM?</h3></div>
                    {explanation.status === "loading" && <p className="explanation-loading"><LoaderCircle className="spin" size={17} />Analyzing team context...</p>}
                    {explanation.status === "success" && <p>{explanation.text}</p>}
                    {explanation.status === "error" && <div className="explanation-error"><p>{explanation.text}</p><button onClick={() => void loadExplanation()}><RefreshCw size={15} />Retry explanation</button></div>}
                  </div>
                  <span className="openai-label">OPENAI</span>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {pendingCandidate && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target && confirmationState !== "confirming") setPendingCandidate(null);
        }}>
          <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            {confirmationState !== "scheduled" ? (
              <>
                <div className="dialog-header">
                  <div><p className="eyebrow">CONFIRM MEETING</p><h2 id="confirm-title">Schedule {group.meeting.title}</h2></div>
                  <button className="icon-button" onClick={() => setPendingCandidate(null)} aria-label="Close dialog" disabled={confirmationState === "confirming"}><X size={19} /></button>
                </div>
                <div className="confirmation-time">
                  <span>{pendingCandidate.dayLabel.slice(0, 3).toUpperCase()}</span>
                  <div><strong>{pendingCandidate.dayLabel}, {pendingCandidate.dateLabel}</strong><p>{formatRange(pendingCandidate)} · {group.meeting.duration} minutes</p></div>
                </div>
                <div className="confirmation-facts">
                  <div><Users size={18} /><span><strong>{pendingCandidate.availableMembers.length} attendees</strong><small>{pendingCandidate.unavailableMembers.length ? `${pendingCandidate.unavailableMembers.length} conflict` : "Everyone is available"}</small></span></div>
                  <div><CalendarCheck2 size={18} /><span><strong>Calendar invite</strong><small>Created after confirmation</small></span></div>
                  <div><MailCheck size={18} /><span><strong>Email update</strong><small>Sent to all members</small></span></div>
                </div>
                <div className="dialog-actions">
                  <button className="secondary-button" onClick={() => setPendingCandidate(null)} disabled={confirmationState === "confirming"}>Cancel</button>
                  <button className="primary-button" onClick={confirmMeeting} disabled={confirmationState === "confirming"}>
                    {confirmationState === "confirming" ? <><LoaderCircle className="spin" size={17} />Scheduling...</> : <><CalendarCheck2 size={17} />Confirm meeting</>}
                  </button>
                </div>
              </>
            ) : (
              <div className="scheduled-state">
                <span className="success-icon"><Check size={28} /></span>
                <p className="eyebrow">MEETING SCHEDULED</p>
                <h2 id="confirm-title">The team is on the calendar.</h2>
                <p>{group.meeting.title} is set for {pendingCandidate.dayLabel} at {formatRange(pendingCandidate).split("–")[0]} {Number(pendingCandidate.time.slice(0, 2)) >= 12 ? "PM" : "AM"}.</p>
                <div><span><CalendarCheck2 size={17} />Calendar invites created</span><span><MailCheck size={17} />Notifications sent</span></div>
                <button className="primary-button" onClick={() => setPendingCandidate(null)}>Done</button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
