# AI Meeting Coordinator

An AI-assisted coordination layer for small teams. It does not merely find a free slot: it combines calendar availability, meeting context, attendance history, and each member's preferences to recommend the meeting most likely to happen.

## MVP principle

The LLM never calculates the schedule by itself. The rule engine generates and scores candidate slots; the AI parses natural-language constraints, explains the recommendation, and mediates conflicts.

```text
Natural-language request -> AI constraint parser -> rule engine -> ranked candidates
                                                              -> AI explanation -> confirmation
```

## Data model

- [Database design and ERD](docs/database.md)
- [Importable DBML ERD](docs/erd.dbml)
- [Initial Supabase/Postgres migration](supabase/migrations/0001_initial_schema.sql)
- [Secure group join-code migration](supabase/migrations/0002_group_join_codes.sql)
- [Page data contracts](docs/page-contracts.md)
- [Shared MVP mock fixture](fixtures/mvp-demo.json)
- [Static HTML page merge guide](docs/html-merge-guide.md)
- [Team Git workflow](CONTRIBUTING.md)
- [Gmail adjustment-email demo setup](docs/gmail-mediation-demo.md)
- [Group join-code data and RPC flow](docs/database.md#joining-a-group-with-a-code)

## Privacy boundary

Google Calendar is used to produce availability data. Calendar event details and OAuth tokens are not exposed to other group members. The initial schema stores only busy blocks required for scheduling, while provider tokens must live in secure server-side storage.

For the hackathon demo, a separately consented Gmail connection can create an individual adjustment-request draft after a coordinator reviews it. It never sends automatically from calendar data.

## Suggested ownership

| Area | Branch prefix | Main routes / modules |
| --- | --- | --- |
| Auth and personal dashboard | `feature/auth-profile` | `/login`, `/me` |
| Group workspace | `feature/group-workspace` | `/groups/[groupId]` |
| Scheduling flow | `feature/scheduling` | `/groups/[groupId]/schedule/[requestId]`, rule engine |
| Data, integration, QA | `feature/data-integration` | Supabase migration, Calendar sync, fixtures |

See [CONTRIBUTING.md](CONTRIBUTING.md) before creating a branch or pull request.
