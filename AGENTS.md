# Agent Guide

Use this file for agent-specific operating instructions in this repository.

Project domain, business rules, and ubiquitous language live in `CONTEXT.md`.

## Working Agreement

- Write all code, identifiers, file names, and architecture definitions in English.
- Communicate with the user in Spanish.
- Prefer strong typing and keep `any` out of the codebase.
- Keep functions small and focused on one responsibility.
- Prefer guard clauses over deeply nested conditionals.
- Use defensive error handling around asynchronous work and data mutations.
- Make mutation scripts idempotent when duplicates would be harmful.
- Add comments only when they explain non-obvious intent or constraints.

## Domain Source

Before making product or architecture decisions, read `CONTEXT.md`.

If an architectural decision has been formalized later, prefer the relevant ADR in `docs/adr/`.

## Agent skills

### Issue tracker

Issues and PRDs for this repo are tracked as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

This repo uses the default canonical triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain docs layout. See `docs/agents/domain.md`.

## Testing Standards

- File Separation: Never mix test files with production code. Place all tests strictly inside a centralized `tests/` directory mirroring the `src/` structure.
- Naming Convention: Name test files explicitly as `*.test.ts` or `*.spec.ts` depending on the framework configuration.
- Isolation & Cleanliness: Each test must be completely isolated and independent. Always mock external network requests, databases, and third-party APIs.
- Readability (AAA Pattern): Structure tests using the Arrange-Act-Assert pattern. Keep assertions clear, focused, and descriptive of the expected behavior, not the implementation details.