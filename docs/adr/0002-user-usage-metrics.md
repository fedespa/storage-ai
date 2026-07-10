# ADR-0002: User-scoped usage metrics

## Status

Accepted

## Context

The product needs to expose token consumption and S3 storage consumption to each user. Token data must preserve one record per chat-model interaction so the system can audit and aggregate usage later. Storage usage must reflect the current size of every non-deleted document owned by the user.

The application performs two chat-model interactions for a normal question: query reformulation and grounded answer generation. Embedding generation also consumes provider tokens, but it is a different operation and does not provide the same prompt/completion metric contract.

## Decision

- Persist one token-usage record for each successful chat-model interaction.
- Include query reformulation and grounded answer generation.
- Exclude embedding generation from this metric.
- Do not persist a record when the interaction fails or its usage metadata is unavailable or unreliable.
- Expose the aggregate through an authenticated `GET /usage` endpoint.
- Derive the user identity from the authenticated request; the endpoint accepts no user identifier.
- Calculate storage usage from non-deleted documents owned by the authenticated user, regardless of document processing status.
- Report storage usage in decimal megabytes, using 1,000,000 bytes per megabyte, with up to two decimal places.

## Consequences

The token-usage table is append-oriented and supports historical auditing and aggregate queries. A normal successful question contributes two records. Failed or incomplete provider responses do not create misleading usage data. Storage usage remains current because it is calculated from the documents table rather than maintained as a separately mutable counter.
