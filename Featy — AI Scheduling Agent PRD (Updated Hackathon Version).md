# Featy — AI Scheduling Agent PRD

## 1. Product Summary

### One-line description

**Featy is an AI scheduling agent that finds when a team should meet, not simply when everyone is free.**

It combines:

- Personal calendars
- Group availability
- Attendance history
- User preferences
- Meeting context
- Rule-based scheduling
- AI recommendations

to recommend and coordinate the best meeting time for a group.

---

# 2. Problem

Current scheduling products generally answer:

> “When is everyone available?”

However, teams often need to answer a more complex question:

> “Given everyone’s schedules and team context, when should we actually meet?”

Meeting coordination involves more than finding overlapping free time.

Factors include:

- Who is required to attend?
- How many people can attend?
- Who has missed previous meetings?
- Does the group prefer morning or afternoon?
- How many meetings does each person already have that day?
- Is this a recurring meeting?
- Is this the first meeting or the tenth meeting?
- Is it better to schedule now with 4/5 members or delay until all 5 can attend?

Featy aims to solve this coordination problem.

---

# 3. Product Vision

Featy evolves through three stages.

```text
Rule-Based Scheduler
        ↓
AI-Assisted Scheduler
        ↓
Autonomous Scheduling Agent
```

### Stage 1 — Rule-Based Scheduler

Calculate the best meeting time using deterministic rules.

### Stage 2 — AI Scheduling Assistant

AI understands natural-language requests and explains scheduling decisions.

### Stage 3 — Scheduling Agent

AI proactively:

- detects scheduling conflicts
- proposes rescheduling
- mediates between members
- creates meetings
- sends notifications
- analyzes attendance patterns

The hackathon MVP focuses primarily on **Stage 1 + Stage 2**.

---

# 4. Hackathon Goal

Build a working product flow that demonstrates:

```text
Google Login

↓

Personal Dashboard

↓

Open Group

↓

See members + calendars

↓

See overlapping availability

↓

Generate best meeting times

↓

AI explains recommendation

↓

Confirm meeting
```

The goal is **not** to build a full Google Calendar replacement.

The goal is to demonstrate the intelligence layer on top of calendars.

---

# 5. Target Users

### Primary users

- Startup teams
- Project teams
- University teams
- Hackathon teams
- Small organizations with recurring meetings

### Ideal group size

3–10 people.

---

# 6. Information Architecture

The MVP consists of **three main pages**.

```text
/login

/personal

/group/[groupId]
```

Shared navigation appears after login.

```text
Featy

Personal

Groups
• Design Team
• Engineering Team
• Hackathon Team

+ Create Group

────────────

Profile
Settings
Logout
```

---

# 7. Page 1 — Login Page

Route:

```text
/login
```

## Objective

Allow users to enter Featy using their Google account.

The login experience should be extremely simple.

### UI

```text
Featy

AI that finds when your team
should meet.

Not just when everyone is free.

[ Continue with Google ]
```

Optional supporting text:

> Connect your calendar and coordinate meetings automatically.

---

## Primary feature

### Google Authentication

Use:

```text
Google OAuth
```

After authentication:

```text
Google Login
    ↓
Create / retrieve user
    ↓
Redirect to /personal
```

---

## User model

```ts
type User = {
  id: string
  name: string
  email: string
  avatar: string

  preferredTime?: "morning" | "afternoon" | "none"

  attendanceRate?: number
}
```

For the hackathon, Google OAuth can be replaced with a mock login if integration creates too much risk.

Priority:

```text
working demo > authentication completeness
```

---

# 8. Page 2 — Personal Dashboard

Route:

```text
/personal
```

## Objective

Give the user a single view of:

- their calendar
- upcoming meetings
- their groups
- meeting statistics
- scheduling actions

---

# 9. Personal Page Layout

Recommended structure:

```text
┌─────────────────────────────────────────────────────┐
│ Sidebar │ Hello, Minjae                             │
│         │                                           │
│Personal │ Ask Featy                                 │
│         │ [ Find a meeting time...              ]  │
│Groups   │                                           │
│         │ Today's Meetings                          │
│Design   │                                           │
│Dev      │ Personal Calendar                         │
│Hackathon│                                           │
│         │ Meeting Stats                             │
└─────────────────────────────────────────────────────┘
```

---

# 10. Personal Dashboard Features

## 10.1 Personal Calendar

Display the user's weekly calendar.

The MVP does not need a full calendar editor.

Only display:

- busy times
- existing meetings
- upcoming meetings

Example:

```text
Monday

09:00
10:00  Product Sync
11:00

13:00
14:00  Design Review
15:00
```

---

# 11. Today's Meetings

Example:

```text
Today's Meetings

10:00–10:30
Product Standup

14:00–15:00
Design Sync

17:00–17:30
Hackathon Check-in
```

Meeting cards may show:

```text
Meeting name
Time
Group
Participants
```

---

# 12. Personal Meeting Statistics

Show lightweight statistics.

```text
Meetings this week
6

Meeting hours
5.5 h

Attendance
91%

Groups
3
```

These numbers can initially use mock data.

Their purpose is to demonstrate that Featy understands **meeting behavior**, not only calendar availability.

---

# 13. Ask Featy Input

The Personal page contains a natural-language scheduling input.

Example:

```text
Ask Featy

"Find a 1-hour meeting time for
the Hackathon Team this week,
preferably in the afternoon."

[ Find Time ]
```

AI converts the request into structured constraints.

Example:

```json
{
  "group": "Hackathon Team",
  "duration": 60,
  "dateRange": "this_week",
  "preferredTime": "afternoon"
}
```

The user is then shown the group's scheduling page.

---

# 14. Groups List

The sidebar contains the user's groups.

Example:

```text
Groups

Design Team

Engineering

Hackathon Team

+ Create Group
```

Clicking one navigates to:

```text
/group/[groupId]
```

---

# 15. Page 3 — Group Scheduling Page

Route:

```text
/group/[groupId]
```

## Objective

This is the **core product experience**.

The Group page combines:

- group information
- members
- calendars
- availability
- meeting statistics
- scheduling recommendations
- AI reasoning

This should receive the majority of the hackathon development time.

---

# 16. Group Page Layout

Recommended layout:

```text
┌──────────────────────────────────────────────────────────┐
│ Sidebar │ Hackathon Team                                 │
│         │ 5 Members · Meeting #12 · Attendance 87%      │
│         │                                                │
│         │ [ Find Best Meeting Time ]                     │
│         │                                                │
│         │ Members        Group Calendar                  │
│         │ ┌─────────┐   ┌────────────────────────────┐  │
│         │ │ Minjae  │   │ Mon Tue Wed Thu Fri       │  │
│         │ │ Jisoo   │   │                            │  │
│         │ │ Hyunwoo │   │ Availability              │  │
│         │ │ Sora    │   │                            │  │
│         │ │ Daniel  │   └────────────────────────────┘  │
│         │                                                │
│         │ Recommended Times                              │
│         │                                                │
│         │ [ Tue 2PM ] [ Wed 4PM ] [ Thu 1PM ]           │
└──────────────────────────────────────────────────────────┘
```

---

# 17. Group Header

Display contextual information.

Example:

```text
Hackathon Team

5 Members

Weekly Meeting

Meeting #12

Average Attendance
87%

[ Find Best Time ]
```

This helps position Featy as a **team coordination tool**, rather than simply another calendar.

---

# 18. Members Panel

Show all members in the selected group.

Example:

```text
Members

Minjae
95% attendance
Prefers afternoon

Jisoo
72% attendance
Prefers morning

Hyunwoo
88% attendance
Busy this afternoon

Sora
91% attendance

Daniel
84% attendance
```

---

# 19. Member Data

```ts
type Member = {
  id: string
  name: string
  avatar: string

  attendanceRate: number

  preferredTime:
    | "morning"
    | "afternoon"
    | "none"

  required?: boolean
}
```

---

# 20. Group Calendar

The calendar displays group availability.

Instead of showing five completely separate calendars, Featy displays **availability density**.

Example:

```text
        Mon     Tue     Wed     Thu     Fri

09:00   3/5     4/5     2/5     5/5     3/5

10:00   4/5     4/5     3/5     5/5     4/5

11:00   2/5     5/5     3/5     4/5     3/5

13:00   3/5     5/5     4/5     3/5     5/5

14:00   4/5     5/5     4/5     4/5     3/5

15:00   3/5     4/5     5/5     4/5     2/5
```

Visual strength represents availability.

```text
5/5
Strong highlight

4/5
Medium highlight

3/5
Light highlight

0–2/5
No highlight
```

---

# 21. Availability Detail

Clicking a time slot displays:

```text
Tuesday

14:00–15:00

5 / 5 available

Minjae   Available
Jisoo    Available
Hyunwoo  Available
Sora     Available
Daniel   Available
```

If someone cannot attend:

```text
Wednesday

16:00–17:00

4 / 5 available

Minjae   Available
Jisoo    Available
Hyunwoo  Unavailable
Sora     Available
Daniel   Available
```

---

# 22. Rule-Based Scheduling Engine

The system generates possible meeting slots.

Example slot generation:

```text
09:00
09:30
10:00
10:30
...
17:30
```

For each slot, calculate:

```text
Available members

Required members available

Group attendance ratio

Preference match

Meeting load

Attendance priority
```

---

# 23. Candidate Scoring

Example scoring formula:

```text
Total Score =

Availability                 40%

Required Member Availability 20%

Preference Match             15%

Attendance Priority          15%

Meeting Load                 10%
```

Example:

| Time | Available | Preference | Required | Score |
|---|---:|---:|---:|---:|
| Tue 2 PM | 5/5 | High | Yes | 94 |
| Wed 4 PM | 4/5 | High | Yes | 82 |
| Thu 1 PM | 4/5 | Medium | Yes | 79 |

---

# 24. Attendance Priority

Attendance history helps resolve conflicts.

Example:

```text
Minjae
19 / 20 meetings
95%

Jisoo
15 / 21 meetings
71%

Hyunwoo
18 / 20 meetings
90%
```

Suppose there is no slot where everyone can attend.

Candidate A:

```text
Jisoo absent
```

Candidate B:

```text
Minjae absent
```

Because Jisoo has already missed several meetings, Featy may prioritize Candidate B.

---

# 25. Recommended Times

The Group page displays the top three candidate times.

Example:

```text
Recommended

★ Tuesday
2:00–3:00 PM

5 / 5 available

Score
94

✓ All members available
✓ Afternoon preference
✓ Required members available

[ Select ]
```

---

Second recommendation:

```text
Wednesday

4:00–5:00 PM

4 / 5 available

Score
82

Unavailable
Hyunwoo

[ Select ]
```

---

Third recommendation:

```text
Thursday

1:00–2:00 PM

4 / 5 available

Score
79

Unavailable
Jisoo

[ Select ]
```

---

# 26. AI Recommendation Layer

The Rule Engine determines the actual ranking.

The AI does **not** generate arbitrary meeting times.

Architecture:

```text
Calendars
     ↓
Rule Engine
     ↓
Candidate Slots
     ↓
Scoring
     ↓
Top 3 Candidates
     ↓
LLM
     ↓
Explanation
```

This makes the system:

- predictable
- explainable
- stable during demonstrations

---

# 27. AI Explanation

Example:

```text
Why Tuesday at 2 PM?

All five members are available during this slot.

It also matches the team's preference for afternoon
meetings and avoids placing another meeting directly
after Minjae's existing meeting.

This slot received a score of 94/100.
```

---

# 28. AI Mediation

When there is no perfect time:

```text
No time is available for all five members.
```

Featy can explain the tradeoff.

Example:

```text
Tuesday 3 PM is recommended.

4 of 5 members are available.

Hyunwoo cannot attend, but he has attended all five
recent team meetings.

Jisoo has missed two recent meetings, so her
availability was prioritized.
```

---

# 29. Meeting Confirmation

After selecting a candidate:

```text
Hackathon Team

Tuesday
2:00–3:00 PM

5 / 5 members available

[ Confirm Meeting ]
```

After confirmation:

```text
Meeting Scheduled

Hackathon Team Weekly Sync

Tuesday
2:00–3:00 PM

5 attendees

Calendar invite created

Email notifications sent
```

For the hackathon, both actions may initially be simulated.

---

# 30. Meeting Context

Store basic information about recurring meetings.

```ts
type MeetingContext = {
  title: string

  type:
    | "one_time"
    | "weekly"
    | "monthly"

  meetingNumber?: number

  importance:
    | "low"
    | "normal"
    | "high"

  duration: number
}
```

Example:

```text
Hackathon Weekly Sync

Meeting #12

Duration
60 min

Importance
High
```

---

# 31. Group Data Model

```ts
type Group = {
  id: string

  name: string

  members: Member[]

  meetingCount: number

  averageAttendance: number

  preferredMeetingTime?:
    | "morning"
    | "afternoon"
    | "none"
}
```

---

# 32. Calendar Event Model

```ts
type CalendarEvent = {
  id: string

  userId: string

  title: string

  start: string

  end: string
}
```

---

# 33. Candidate Slot Model

```ts
type CandidateSlot = {
  start: string

  end: string

  availableMembers: string[]

  unavailableMembers: string[]

  availabilityRate: number

  preferenceScore: number

  attendancePriorityScore: number

  meetingLoadScore: number

  score: number

  reason?: string
}
```

---

# 34. Recommended Technical Architecture

```text
Next.js Frontend
       │
       │
       ▼
Scheduling API
       │
       ├───────────────┐
       │               │
       ▼               ▼
Calendar Data       LLM
       │               │
       ▼               │
Rule Engine            │
       │               │
       ▼               │
Candidate Ranking      │
       │               │
       └───────┬───────┘
               ▼
        AI Explanation
               │
               ▼
             UI
```

---

# 35. Suggested Technology Stack

## Frontend

```text
Next.js

TypeScript

Tailwind CSS

shadcn/ui
```

---

## Authentication

Recommended:

```text
Supabase Auth
+
Google OAuth
```

Alternative:

```text
NextAuth / Auth.js
```

For the MVP:

```text
mock login
```

is acceptable if OAuth integration threatens completion.

---

# 36. Database

Recommended:

```text
Supabase
```

Tables:

```text
users

groups

group_members

calendar_events

meetings

meeting_participants
```

For the hackathon, these may initially be stored as mock JSON.

---

# 37. AI Usage

AI should be used for only a few high-impact tasks.

### Task 1 — Parse scheduling requests

Input:

```text
Find an hour for the Hackathon Team
this week, preferably after lunch.
```

Output:

```json
{
  "group": "Hackathon Team",
  "duration": 60,
  "dateRange": "this_week",
  "preferredTime": "afternoon"
}
```

---

### Task 2 — Explain recommendations

Input:

```json
{
  "time": "Tuesday 14:00",
  "available": 5,
  "total": 5,
  "preferenceMatch": true,
  "score": 94
}
```

AI output:

```text
Tuesday at 2 PM is recommended because
all five members are available and the
slot matches the team's afternoon preference.
```

---

### Task 3 — Mediate scheduling conflicts

When no perfect match exists, AI explains the best compromise.

---

# 38. Agent Expansion

The initial Rule Engine can later become a tool used by an AI agent.

Potential tools:

```text
get_personal_calendar()

get_group_members()

get_group_availability()

get_attendance_history()

generate_candidate_slots()

rank_candidate_slots()

create_calendar_event()

send_email()
```

Future flow:

```text
User

"Set up our weekly meeting."

↓

Agent

get_group_members()

↓

get_group_availability()

↓

rank_candidate_slots()

↓

Agent

"Tuesday at 2 PM is the best option."

↓

User

"Schedule it."

↓

create_calendar_event()

↓

send_email()
```

---

# 39. Free vs Paid Features

## Free

- Google login
- Personal calendar
- Group creation
- Group availability
- Basic scheduling
- Top 3 meeting times
- Email notification

---

## Pro

- Attendance analytics
- Recurring meeting intelligence
- AI mediation
- Personal preference learning
- Team scheduling patterns
- Unlimited groups
- Scheduling recommendations across longer periods

Example insight:

```text
The Design Team's attendance rate is
18% higher for Tuesday afternoon meetings.
```

---

# 40. MVP Feature Priority

## P0 — Must Have

These need to work during the demo.

### Login

```text
Google login
or mock login
```

### Personal

```text
Personal calendar

Groups sidebar

Upcoming meetings
```

### Group

```text
Members list

Availability calendar

Top 3 available times

Scheduling score

Confirm meeting
```

---

# 41. P1 — Strongly Recommended

Add if core flow is complete.

```text
AI recommendation explanation

Attendance rates

Natural-language scheduling input

Meeting number

Meeting duration
```

---

# 42. P2 — Fake or Skip During Hackathon

Do not spend significant development time here.

```text
Real email delivery

Advanced Google Calendar write access

Complex group permissions

Calendar editing

Advanced settings

Billing

Real attendance tracking
```

---

# 43. Three-Hour Build Plan

## 0:00–0:20

Build application shell.

Create:

```text
/login

/personal

/group/[id]

Sidebar
```

---

## 0:20–0:40

Login and Personal page.

Add:

```text
Google-style login

Personal calendar

Groups

Upcoming meetings
```

Use mock data if necessary.

---

## 0:40–1:30

Focus entirely on the Group page.

Build:

```text
Group header

Members list

Calendar grid

Availability visualization
```

---

## 1:30–2:00

Implement scheduling logic.

Functions:

```ts
generateSlots()

checkAvailability()

calculateScore()

rankSlots()
```

Return:

```text
Top 3 candidates
```

---

## 2:00–2:25

Add AI layer.

Implement:

```text
Natural language
→ constraints
```

and:

```text
Candidate data
→ recommendation explanation
```

---

## 2:25–2:45

Build confirmation flow.

```text
Select candidate

↓

Confirm Meeting

↓

Meeting Scheduled
```

Calendar/email integrations may remain simulated.

---

## 2:45–3:00

Polish the demo.

Focus on:

```text
Loading states

Animations

Clear score cards

Good mock data

AI explanation

Smooth navigation
```

---

# 44. Recommended Demo Data

Create five fictional group members.

```ts
const members = [
  {
    name: "Minjae",
    attendanceRate: 95,
    preferredTime: "afternoon"
  },

  {
    name: "Jisoo",
    attendanceRate: 72,
    preferredTime: "morning"
  },

  {
    name: "Hyunwoo",
    attendanceRate: 88,
    preferredTime: "afternoon"
  },

  {
    name: "Sora",
    attendanceRate: 91,
    preferredTime: "none"
  },

  {
    name: "Daniel",
    attendanceRate: 84,
    preferredTime: "afternoon"
  }
]
```

Make sure the mock calendars contain one obviously strong recommendation.

For example:

```text
Tuesday 14:00

5 / 5 available
```

This guarantees a clean demo.

---

# 45. Main Demo Scenario

## Step 1

User sees:

```text
Featy

Continue with Google
```

Clicks login.

---

## Step 2

Personal dashboard appears.

```text
Welcome back, Minjae

Today's Meetings

Personal Calendar

Groups

Hackathon Team
```

---

## Step 3

User opens:

```text
Hackathon Team
```

---

## Step 4

Group page shows:

```text
Hackathon Team

5 Members

Meeting #12

Attendance
87%
```

Alongside:

```text
Member list

+

Group availability calendar
```

---

## Step 5

User clicks:

```text
Find Best Meeting Time
```

---

## Step 6

Featy displays:

```text
Recommended

Tuesday
2:00–3:00 PM

5 / 5 available

Score
94
```

Alternative slots also appear.

---

## Step 7

AI explains:

```text
Tuesday at 2 PM is the best option because
all five members are available and it matches
the group's afternoon meeting preference.
```

---

## Step 8

User clicks:

```text
Confirm Meeting
```

---

## Step 9

Display:

```text
Meeting Scheduled

Calendar invites created

Email notifications sent
```

---

# 46. Core Differentiator

Existing scheduling tools focus primarily on:

```text
Who is free?
```

Featy combines:

```text
Availability

+

Personal Preferences

+

Attendance History

+

Meeting History

+

Group Context

+

AI Reasoning
```

to answer:

> **When should this team meet?**

---

# 47. Product Positioning

### Calendly

```text
Find a time between people.
```

### Google Calendar

```text
Manage calendar events.
```

### Featy

```text
Understand the team and decide
the best time to meet.
```

---

# 48. Hackathon Pitch

### Problem

> Scheduling tools know when you're free, but they don't understand your team.

### Solution

> Featy combines calendars, attendance, preferences, and meeting context to recommend when a team should actually meet.

### Technology

> We use a deterministic scheduling engine for reliable decisions and AI for understanding requests, mediating conflicts, and explaining recommendations.

### Vision

> Today Featy recommends your next meeting.  
> Tomorrow Featy coordinates your team's schedule automatically.

---

# 49. Hackathon Success Criteria

The MVP is successful if the following flow works smoothly:

```text
Login

↓

Personal Dashboard

↓

Open Group

↓

View Members

↓

View Calendar Availability

↓

Generate Top 3 Meeting Times

↓

Explain Best Recommendation

↓

Confirm Meeting
```

Everything else is secondary.

The strongest version of the hackathon demo should make the judge immediately understand:

> **Featy is not another calendar UI.**

It is an **intelligence and coordination layer on top of calendars.**