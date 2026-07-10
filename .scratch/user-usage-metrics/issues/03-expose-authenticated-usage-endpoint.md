# Expose the Authenticated Usage Endpoint

Status: ready-for-agent

## What to build

Expose a `GET /usage` endpoint that returns the authenticated user's token usage and storage usage through a stable contract without allowing the request to select another user.

## Acceptance criteria

- [ ] An authenticated request to `GET /usage` returns the top-level `tokenUsage` and `storageUsage` groups.
- [ ] `tokenUsage` exposes prompt, completion, and total token totals.
- [ ] `storageUsage` exposes megabytes only and does not expose bytes.
- [ ] The identity used for aggregation comes exclusively from the authenticated JWT.
- [ ] The endpoint accepts no `userId` in the path, query string, or request body.
- [ ] An unauthenticated request is rejected.
- [ ] A request authenticated as one user returns no token records or documents belonging to another user.
- [ ] Tests cover the response contract, authentication rejection, and cross-user isolation at the highest practical application seam.

## Blocked by

- Aggregate User Usage Metrics

