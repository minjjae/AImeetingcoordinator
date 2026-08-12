# Gmail mediation-email demo

This integration demonstrates the last mile of the scheduling flow: when a chosen candidate conflicts with a member's calendar, the coordinator can ask that member whether their conflicting event is movable.

```text
candidate has a busy member
-> coordinator selects "Create adjustment email"
-> preview the recipient, candidate, and copy
-> save a Gmail draft or send after explicit confirmation
-> if the person cannot adjust, generate another ranked candidate
```

## Scope and privacy

- The email is an **adjustment request**, not an instruction to move an event.
- The app uses only the person's `busy` status. It never includes the conflicting event title or calendar details in the email.
- Sending Gmail requires a separate, opt-in Gmail OAuth grant. Google Calendar consent alone is insufficient.
- The GWS CLI profile belongs to the account that authenticated locally. It is appropriate for the hackathon presenter/test account; a production web app needs its own server-side OAuth integration for each sender.
- Never commit OAuth client secrets, tokens, or real teammate email addresses.

## One-time presenter setup

1. Install Node.js 18 or later.
2. Install the Google Workspace CLI:

   ```powershell
   npm install -g @googleworkspace/cli
   ```

3. Complete OAuth in a browser. Select Gmail only when prompted for the email-demo permission:

   ```powershell
   gws auth setup
   gws auth login
   ```

4. Use a presenter-owned test recipient first. OAuth credentials remain in the local secure CLI configuration; they must not be copied into this repository.

## Demo commands

The script defaults to a no-send dry run. It makes the email body from the selected candidate and supports a Gmail draft before a real send.

```powershell
# 1. Validate the request only; no email or draft is created.
.\scripts\send-mediation-email.ps1 `
  -To "presenter-test@example.com" `
  -RecipientName "지수" `
  -Candidate "8월 13일(목) 16:00–17:00" 

# 2. Create a Gmail draft for the live demo.
.\scripts\send-mediation-email.ps1 `
  -To "presenter-test@example.com" `
  -RecipientName "지수" `
  -Candidate "8월 13일(목) 16:00–17:00" `
  -Mode draft

# 3. Send only after the presenter explicitly confirms the recipient and message.
.\scripts\send-mediation-email.ps1 `
  -To "presenter-test@example.com" `
  -RecipientName "지수" `
  -Candidate "8월 13일(목) 16:00–17:00" `
  -Mode send `
  -ConfirmSend
```

## UI contract

The scheduling page should expose a button only for members whose candidate availability is `busy`:

```text
[조정 요청 메일 만들기] -> preview modal -> [Gmail 초안 저장] / [메일 보내기]
```

When a member marks the request as unavailable, show the next ranked candidate and the `대안 후보 안내하기` action. Do not automatically move a calendar event or send bulk email.

## Evidence for the presentation

1. Show the `busy` label next to the affected member, without event content.
2. Click **조정 요청 메일 만들기** and show the personalised preview.
3. Run `-Mode draft` and open the draft in the presenter's Gmail account.
4. Explain that a production send requires final user confirmation and per-user Gmail consent.

The installed Codex skills used by this workflow are `gws-shared` and `gws-gmail-send`. The latter supports `--dry-run` and `--draft`, which are the preferred demonstration modes.
