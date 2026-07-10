# User Usage Metrics

Status: ready-for-agent

## Problem Statement

Users cannot currently see how many chat-model tokens they have consumed or how much S3 storage their non-deleted documents occupy. The backend also lacks an auditable record for each chat-model interaction, which makes historical aggregation and future usage controls difficult.

## Solution

Add user-scoped usage metrics with two parts:

1. Persist one token-usage record for every successful chat-model interaction.
2. Expose an authenticated `GET /usage` endpoint that aggregates token usage and calculates current document storage usage for the authenticated user.

The endpoint must derive ownership exclusively from the authenticated JWT. It must never accept a user identifier from the client for selecting the data to aggregate.

## User Stories

1. As a user, I want to see my total prompt tokens, so that I understand how much input processing I have consumed.
2. As a user, I want to see my total completion tokens, so that I understand how much generated output I have consumed.
3. As a user, I want to see my total tokens, so that I have one complete usage figure.
4. As a user, I want token usage to include query reformulation, so that all chat-model work triggered by my question is represented.
5. As a user, I want token usage to include grounded answer generation, so that the final response is represented.
6. As a user, I want embedding generation excluded from token usage, so that the metric follows the agreed chat-model accounting boundary.
7. As a user, I want each successful chat-model interaction recorded separately, so that usage remains auditable and can support future reporting.
8. As a user, I want failed model interactions excluded from persisted usage, so that errors do not create misleading records.
9. As a user, I want interactions without reliable provider usage metadata excluded, so that the totals never contain fabricated token values.
10. As a user, I want to know the model used for each recorded interaction, so that the historical data retains its model context.
11. As a user, I want to see the total size of my non-deleted documents, so that I understand my current S3 storage usage.
12. As a user, I want storage usage to include documents in any processing status, so that the metric reflects all non-deleted files I own.
13. As a user, I want storage usage reported in megabytes, so that the value is easy to understand.
14. As a user, I want storage usage calculated with decimal megabytes, so that one megabyte consistently means 1,000,000 bytes.
15. As a user, I want storage usage rounded to at most two decimal places, so that the value is readable without losing useful precision.
16. As a user with no documents, I want storage usage to be zero, so that the endpoint returns a meaningful result instead of null.
17. As an authenticated user, I want to retrieve my metrics from one endpoint, so that the client has a simple usage contract.
18. As an authenticated user, I want the endpoint to use my JWT identity, so that I cannot accidentally request another user's metrics.
19. As an unauthenticated visitor, I want the usage endpoint to reject my request, so that usage data remains private.
20. As a user, I want another user's documents and token records excluded from my totals, so that workspace isolation remains intact.
21. As a maintainer, I want token usage and storage aggregation behind a focused usage module, so that the feature has a clear ownership boundary.
22. As a maintainer, I want the usage calculations covered by behavior-focused tests, so that changes cannot silently corrupt user totals.

## Implementation Decisions

- Create a dedicated `user_token_usages` persistence entity with one row per successful chat-model interaction.
- The token-usage record contains an identifier, `user_id` foreign key, prompt token count, completion token count, total token count, model name, creation timestamp, and update timestamp.
- Token counts are integer values and must come from reliable provider response metadata.
- Record the query-reformulation interaction and grounded-answer interaction.
- Do not record embedding interactions.
- Do not persist a token record when the provider call fails or when usage metadata is absent, malformed, or otherwise unreliable.
- Add the usage module, service, controller, response contract, and repository wiring needed to aggregate both metrics.
- Expose `GET /usage`, protected by the existing authentication guard.
- The endpoint receives no `userId` path parameter, query parameter, or request body field.
- Aggregate token counts by the authenticated user's identifier.
- Calculate storage by summing `documents.size` for the authenticated user where the document is not deleted. Do not filter by processing status.
- Convert storage bytes to decimal megabytes by dividing by 1,000,000.
- Return storage usage with at most two decimal places and return zero when the aggregate has no matching documents.
- Preserve the existing user-data isolation invariant for both repositories and all aggregation queries.
- Integrate token recording at the existing chat-model interaction seam, so both relevant calls can persist their own provider usage metadata.
- Keep embedding accounting out of this feature.
- Update the domain glossary and architectural decision record with the agreed vocabulary and boundaries.

The endpoint response should expose two top-level metric groups:

- `tokenUsage`: prompt, completion, and total token totals.
- `storageUsage`: megabytes only; bytes must not be returned.

## Testing Decisions

- Test external behavior and observable aggregation results rather than private helper implementation details.
- Use the usage service seam with repository doubles to verify token aggregation, storage aggregation, deleted-document exclusion, status-independent inclusion, empty aggregates, decimal conversion, and user filtering.
- Test token-record persistence behavior for successful reformulation and answer interactions.
- Test that failed interactions and interactions without reliable usage metadata do not create records.
- Test that embedding calls do not create token-usage records.
- Add endpoint-level coverage for authentication rejection and authenticated user scoping.
- Verify that a request authenticated as one user cannot return another user's token or document data.
- Follow the existing NestJS/Jest testing setup and add integration coverage at the highest practical application seam.

## Out of Scope

- Counting embedding tokens.
- Adding quotas, limits, billing, alerts, or enforcement based on the metrics.
- Returning per-model, daily, monthly, or time-windowed breakdowns.
- Returning document-level storage details.
- Accepting an administrator or support-user override to inspect another user's metrics.
- Replacing the existing authentication mechanism.
- Maintaining a separate mutable storage counter instead of calculating from non-deleted documents.
- Changing existing chat retrieval, grounding, document processing, or S3 upload behavior beyond recording the agreed metrics.

## Further Notes

- A normal successful user question is expected to produce two token-usage records: one for query reformulation and one for grounded answer generation.
- A question that stops before one of those successful model interactions records only the successful interaction that produced reliable usage metadata.
- The metrics are user-scoped because the product's workspace boundary is the user's ownership boundary.
- The existing architectural decision for vertical-slice chat organization should be respected when integrating token recording with chat interactions.
