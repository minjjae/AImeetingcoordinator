# Page data contracts

These contracts let the four page owners work independently while sharing the same database vocabulary. The first implementation may use mock data with the same shapes; do not change field names independently per page.

## 1. Login - `/login`

**Owner:** Auth/profile

**Purpose:** Authenticate with Google and request only the Calendar read scope required for availability sync.

**Success state:** redirect to `/me` after Supabase Auth creates `auth.users`; the profile trigger creates `profiles`.

**UI states:** signed out, OAuth redirecting, calendar consent missing, connected.

**Write boundary:** Auth/OAuth only. Do not write calendar events or tokens from the browser to application tables.

## 2. Personal dashboard - `/me`

**Owner:** Auth/profile

**Purpose:** Show the signed-in person's next meetings, connection state, weekly report, and a right-hand list of groups they belong to.

**Read model:**

```ts
type PersonalDashboard = {
  profile: { id: string; displayName: string; timezone: string };
  calendar: { status: "connected" | "not_connected" | "needs_reauth"; lastSyncedAt?: string };
  groups: Array<{ id: string; name: string; role: "owner" | "admin" | "member"; personalImportance: 1 | 2 | 3 | 4 | 5 }>;
  upcomingMeetings: Array<{ id: string; title: string; startsAt: string; groupName: string; rsvpStatus: string }>;
  weeklyReport?: { weekStart: string; summary: string; deliveryStatus: "ready" | "read" };
};
```

**Writes:** personal scheduling preferences, group-member `personal_importance` through a controlled server action, report read state.

**Join group action:** the `참여 요청` modal accepts a normalized code matching `^[A-Z]{5}[0-9]{5}$`. An authenticated request calls `join_group_with_code`; success refreshes the user's groups and navigates to the joined group. Invalid, expired, exhausted, and duplicate codes receive explicit UI states. A group owner creates a code through `create_group_join_code` and shares the plaintext returned once.

## 3. Group workspace - `/groups/[groupId]`

**Owner:** Group workspace

**Purpose:** Present one team's membership and its active coordination work.

**Tabs:**

1. **Members** - member display name, role, personal group importance, and availability label only. Do not expose event titles.
2. **Available slots** - active requests and their top candidates, labelled with `3/4 available`, required-member status, and score.
3. **Meetings** - confirmed/held meetings and group-level attendance summary.

**Read model:**

```ts
type GroupWorkspace = {
  group: { id: string; name: string; description?: string; defaultMeetingImportance: 1 | 2 | 3 | 4 | 5 };
  members: Array<{ userId: string; displayName: string; role: string; personalImportance: number; availability: "available" | "busy" | "unknown" }>;
  activeRequests: Array<{ id: string; title: string; status: "draft" | "ranked" | "confirmed"; candidateCount: number }>;
  recentMeetings: Array<{ id: string; title: string; startsAt: string; attendance: { attended: number; total: number } }>;
};
```

## 4. Scheduling review - `/groups/[groupId]/schedule/[requestId]`

**Owner:** Scheduling

**Purpose:** Turn natural language into a transparent recommended slot. This is the pitch-critical screen.

**Input:** raw request such as `이번 주 안에 디자인팀 1시간 회의 잡아줘. 민재는 꼭 참석하고 오후가 좋아.`

**Server flow:**

```text
parse constraints with LLM structured output
-> sync/read busy blocks
-> generate 30-minute candidates
-> rank deterministically
-> save top 3 and per-user availability
-> ask AI to explain the already-ranked result
```

**Read model:**

```ts
type SchedulingReview = {
  request: { id: string; title: string; rawRequest: string; constraints: object; status: string };
  candidates: Array<{
    id: string;
    rank: 1 | 2 | 3;
    startsAt: string;
    endsAt: string;
    score: number;
    scoreBreakdown: { availability: number; required: number; preference: number; attendance: number; meetingLoad: number };
    members: Array<{ displayName: string; isRequired: boolean; availability: "available" | "busy" | "unknown" }>;
  }>;
  aiExplanation: string;
};
```

**Writes:** `meeting_requests`, `meeting_request_participants`, `schedule_candidates`, `candidate_availability`; confirmation creates `meetings` and `meeting_participants`.

## 5. Weekly report - `/reports/weekly`

**Owner:** Auth/profile or data/integration

**Purpose:** Show a personal, in-app weekly schedule report: confirmed meetings, conflicts, and attendance insight by group.

**MVP delivery:** webpage only. A Google Calendar-only consent cannot send Gmail. The optional adjustment-email demo uses a separately consented Gmail connection, creates a preview/draft first, and sends only after explicit confirmation. See [Gmail adjustment-email demo setup](gmail-mediation-demo.md).
