T# AGENTS.md

## Goal

This is a hackathon prototype.

Optimize for:

1. Working demo
2. Fast iteration
3. Simple architecture
4. Good UX
5. Reliability

Do NOT over-engineer.

## Development rules

- Before implementing a large feature, briefly state your plan.
- Prefer the simplest implementation that works.
- Reuse existing components instead of creating unnecessary abstractions.
- Keep files reasonably small.
- Do not refactor unrelated code.
- Never expose API keys in frontend code.
- Store secrets in environment variables.

## OpenAI

- Use the OpenAI Responses API.
- Use the official OpenAI SDK.
- When uncertain about OpenAI API behavior, check current OpenAI docs.
- Prefer structured outputs when the application expects structured data.
- Handle API errors gracefully.

## Verification

After implementing a feature:

1. Run type checking/linting.
2. Run relevant tests if they exist.
3. Fix obvious errors.
4. Verify the main user flow.
5. Report what changed.

## Hackathon behavior

If there are multiple possible implementations:

- choose the fastest reliable approach
- avoid unnecessary infrastructure
- avoid premature optimization

Prioritize the demo path.

## Git

Do not overwrite unrelated user changes.
Keep changes focused on the requested task.
