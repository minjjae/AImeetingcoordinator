# Group meeting optimizer

The static group demo uses a deterministic optimizer. It does not call an LLM to choose a time.

## Browser entry points

- `personal.html` + `app.js`: create a group, issue a `AAAAA00000` join code, or join with the demo code `FEATY20268`.
- `group-calendar-adapter.js`: Google Calendar integration boundary. Keep `getGroupBusyBlocks(...)` and replace its mock implementation.
- `group-scheduler.js`: pure candidate generation, availability evaluation, lexicographic ranking, alternatives, and notification payloads.
- `group-page.js`: form and month-calendar UI only.

## Static demo handoff

The hackathon demo keeps created and joined groups in `localStorage.feetUserGroups`. The personal page opens `group.html?groupId=...`; the group page resolves that ID and renders the correct name, member count, member list, and required-attendee controls. Confirmed meetings are stored per `groupId`, then handed back to the personal calendar with the group name and participant count.

This browser storage is only the no-backend demo adapter. The production path remains the authenticated `create_group_join_code` and `join_group_with_code` RPC flow documented in `page-contracts.md` and the Supabase migrations.

## Calendar adapter contract

```js
await FeetCalendarAdapter.getGroupBusyBlocks({
  weekStart: "2026-08-17",
  participantIds: ["minjae", "jisoo"],
});
```

Return value:

```js
[
  {
    participantId: "jisoo",
    eventId: "google-event-id",
    title: "기존 일정",
    start: "2026-08-18T14:00:00+09:00",
    end: "2026-08-18T15:30:00+09:00",
    status: "ADJUSTABLE" // or "UNAVAILABLE"
  }
]
```

Do not expose event titles to other members. They are retained only so the email integration can tell the affected owner which event needs attention.

## Ranking rule

Each candidate receives this vector:

```text
(
  everyone immediately available,
  everyone available after adjustment,
  required members who can attend,
  general members who can attend,
  negative required-member adjustments,
  negative general-member adjustments,
  group preference score
)
```

Vectors are maximized lexicographically from left to right. The preference score is:

```text
0.45 × preferred weekday match
+ 0.35 × preferred time overlap
+ 0.20 × preferred mode match
```

Ties use earlier time-of-day, then earlier date. This keeps preferences from overriding attendance constraints.

## Email integration data

`FeetScheduler.optimizeMeeting(...)` returns:

```js
{
  confirmedSlot,
  alternativeSlots,
  notifications: {
    adjustmentRequired: [],
    unavailable: []
  }
}
```

Each notification item includes the affected participant and conflict event identifiers. The email owner can use these arrays to select the correct template without changing the optimizer.
