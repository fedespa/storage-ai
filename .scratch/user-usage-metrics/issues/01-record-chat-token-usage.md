# Record Chat Interaction Token Usage

Status: ready-for-agent

## What to build

Persist one auditable record for each successful chat-model interaction associated with the authenticated user. Query reformulation and grounded answer generation must record reliable usage metadata; embedding calls remain outside this metric.

## Acceptance criteria

- [ ] A token-usage record exists with the user, prompt tokens, completion tokens, total tokens, model name, and timestamps.
- [ ] A successful reformulation interaction with reliable metadata creates exactly one record.
- [ ] A successful grounded-answer interaction with reliable metadata creates exactly one record.
- [ ] Failed interactions create no records.
- [ ] Interactions with missing, malformed, or otherwise unreliable metadata create no records.
- [ ] Embedding calls create no records.
- [ ] Records are associated with the correct user and retain the model name used.
- [ ] Tests verify observable behavior for successful, failed, incomplete, and embedding interactions.
- [ ] The vocabulary and metric boundaries remain aligned with the domain context and ADR-0002.

## Blocked by

- None - can start immediately

