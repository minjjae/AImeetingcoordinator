# Group meeting optimizer

The static group demo uses a deterministic optimizer. It does not call an LLM to choose a time.

## Browser entry points

- `group-calendar-adapter.js`: Google Calendar integration boundary. Keep `getGroupBusyBlocks(...)` and replace its mock implementation.
- `group-scheduler.js`: pure candidate generation, availability evaluation, lexicographic ranking, alternatives, and notification payloads.
- `group-page.js`: form and month-calendar UI only.

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
