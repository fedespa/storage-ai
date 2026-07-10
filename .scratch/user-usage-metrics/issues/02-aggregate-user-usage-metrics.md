# Aggregate User Usage Metrics

Status: ready-for-agent

## What to build

Create the usage module that calculates a user's historical token-usage totals and current storage used by their non-deleted documents while preserving workspace isolation.

## Acceptance criteria

- [ ] The service returns separate prompt-token, completion-token, and total-token totals for the user.
- [ ] The service sums only token-usage records belonging to the requested user.
- [ ] Storage sums the size of every non-deleted document owned by the user without filtering by processing status.
- [ ] Deleted documents and documents owned by other users are excluded.
- [ ] Storage is converted from bytes to decimal megabytes using 1,000,000 bytes per megabyte.
- [ ] Storage is rounded to at most two decimal places and returns zero when no applicable documents exist.
- [ ] The module exposes focused contracts and wiring so the endpoint can consume one usage-metrics operation.
- [ ] Tests verify aggregation, isolation, deleted-document exclusion, status-independent inclusion, decimal conversion, and empty aggregates.

## Blocked by

- Record Chat Interaction Token Usage

