# DocChat Frontend MVP

Status: ready-for-agent

## Problem Statement

DocChat has a backend for authentication, document ingestion, document processing, chat retrieval, grounded answers, chat history, and usage metrics, but users do not have a web interface through which they can safely use those capabilities. In particular, users need a clear, private workspace for uploading documents, seeing when they become eligible for retrieval, understanding the retrieval scope of a chat, and continuing conversations without losing their session.

The current backend contracts also omit two pieces of data that a reliable chat interface needs: the identifier and metadata of a newly created chat, and the selected documents of an existing chat. Document processing can fail without a terminal state, leaving the client unable to stop polling or explain what happened.

## Solution

Build a responsive Spanish-language single-page application in a new `frontend/` application. The product will provide a unified authenticated workspace for document library management, multi-file upload, document processing feedback, global or selected-document chats, chat history, and personal usage metrics.

The workspace will default new chats to global retrieval across the user's eligible documents. Users may instead select one or more `PROCESSED` documents before the first question. Each conversation will visibly state whether it uses global retrieval or a fixed selected-document boundary.

The implementation will make the smallest backend changes needed to support the browser session model, reliable chat navigation and scope display, and terminal document-processing failures. It will not add unrelated endpoints or product operations.

## User Stories

1. As a visitor, I want the root route to take me to the workspace when I have a valid session, so that I can resume work immediately.
2. As a visitor without a valid session, I want the root route to take me to sign in, so that private data remains protected.
3. As a new user, I want to register with my email address and password, so that I can create my private DocChat account.
4. As a returning user, I want to sign in, so that I can access only my documents, chats, and usage data.
5. As an authenticated user, I want my session restored after a page reload, so that I am not required to sign in again unnecessarily.
6. As an authenticated user, I want to sign out, so that I can end my session on a shared device.
7. As a user who forgot a password, I want to request a reset email, so that I can recover access to my account.
8. As a user following a password-reset link, I want to set a new password and then return to sign in, so that I can continue safely.
9. As a user, I want all MVP interface text and interaction feedback in Spanish, so that the product is consistent and easy to understand.
10. As an authenticated user, I want one unified workspace for chats, documents, and conversation, so that I do not have to navigate between disconnected product areas.
11. As a user, I want an understandable empty state when I have no eligible documents, so that I know I must upload and process a document before starting a chat.
12. As a user, I want chat creation disabled when I have no `PROCESSED` documents, so that I never start a conversation that cannot produce a grounded answer.
13. As a user, I want to upload PDF, DOCX, and TXT files up to 100 MB, so that I can build my document library from supported content.
14. As a user, I want unsupported or oversized files rejected before upload begins, so that I receive immediate, actionable feedback.
15. As a user, I want to choose multiple files in one action, so that building my library is efficient.
16. As a user, I want to see a visible upload queue, so that I understand the state of every file I selected.
17. As a user, I want each queued file to show whether it is waiting, uploading, processing, ready, or failed, so that I can act on individual outcomes.
18. As a user, I want at most three files uploaded concurrently, so that uploads remain responsive without overwhelming the connection or backend.
19. As a user, I want a failed upload or processing operation to offer a retry path, so that a transient problem does not force me to abandon the task.
20. As a user, I want a safe explanation when document processing fails, so that I know why the document cannot be used without seeing internal system details.
21. As a user, I want the library to refresh automatically while documents are pending or processing, so that newly ready documents become selectable without a browser refresh.
22. As a user, I want the automatic refresh to stop once every document reaches a terminal state, so that the application does not make unnecessary requests.
23. As a user, I want to browse and search my document library, so that I can find documents by name.
24. As a user, I want to load additional document results without losing my current context, so that large libraries remain manageable.
25. As a user, I want only `PROCESSED` documents to be selectable for a new chat, so that the selected-document boundary contains only eligible retrieval sources.
26. As a user, I want a new chat to default to “Búsqueda global”, so that I can ask a question quickly across my eligible documents.
27. As a user, I want to replace global retrieval with one or more selected documents before my first question, so that I can restrict the answer to a precise set of sources.
28. As a user, I want every active chat to visibly state whether it is global or which documents were selected, so that I understand the retrieval scope of every grounded answer.
29. As a user, I want the selected-document scope to remain fixed after a chat begins, so that later answers preserve the chat's retrieval boundary.
30. As a user, I want to see my chat history and load additional chats, so that I can resume prior conversations.
31. As a user, I want a newly created chat to become active immediately, so that I can continue it without guessing which history item was just created.
32. As a user, I want to load an existing chat and its messages, so that I can understand the prior conversation before asking another question.
33. As a user, I want to load older messages without interrupting my reading position, so that long conversations remain usable.
34. As a user, I want my question to appear immediately with a “Pensando…” state, so that a model response does not make the interface appear frozen.
35. As a user, I want an unsuccessful message request to show a clear error and retry option, so that I can recover from temporary failures.
36. As a user, I want answers shown as grounded answers without invented citations, so that the interface does not claim source details the backend did not provide.
37. As a user, I want to see my prompt, completion, and total token usage plus storage usage, so that I can understand my use of the product.
38. As a user, I want the theme to default to light and optionally switch to dark, so that I can choose a comfortable reading experience.
39. As a keyboard user, I want visible focus, logical navigation, and usable controls, so that I can operate every core flow without a pointer.
40. As a screen-reader user, I want controls, status changes, and errors to be labeled and announced appropriately, so that the workspace remains understandable.
41. As a user, I want sufficient color contrast and non-color status indicators, so that document and chat states remain legible.
42. As a user, I want private data and session failures handled without exposing another user's information, so that the user ownership boundary is preserved in the client experience.

## Implementation Decisions

- Create a React, TypeScript, Vite, and Tailwind CSS single-page application under `frontend/`.
- Use React Router for public authentication routes and protected workspace routes. The root route restores the session first, then redirects to the workspace or sign-in as appropriate.
- Keep all interface copy in Spanish for this MVP.
- Use a sober, professional visual system focused on reading, document trust, and privacy. The light theme is the default; a dark theme is optional and selected by the user.
- Organize frontend code by feature modules: authentication, documents, chats, and usage. Each module owns its UI, state logic, types, and remote-data behavior. Shared UI, utilities, and the HTTP adapter remain separate and contain only truly cross-feature responsibilities.
- Keep modules deep: callers use high-level feature hooks rather than coordinating request state, polling, pagination, retries, or upload steps themselves.
- Do not use TanStack Query. Implement remote-data behavior with focused React hooks and reducers where necessary. Use React context only for session and theme state.
- Provide one HTTP adapter as the external seam for backend requests. It attaches the in-memory access token, sends browser credentials, normalizes request failures, attempts exactly one token refresh after an authentication failure, and retries the original request only after a successful refresh.
- Keep the access token only in memory. Use the backend refresh-token cookie for session restoration and renewal; do not persist an access token in browser storage.
- Configure the frontend base URL and backend allowed frontend origin through environment configuration. The backend CORS configuration must allow the configured frontend origin with credentials instead of combining credentials with a wildcard origin.
- Build a unified protected workspace containing chat history, document library and upload access, active conversation, document-scope display, and a discreet usage panel.
- List chats, messages, and documents through their existing paginated contracts. Present pagination through “Cargar más”, appending results without replacing the visible context.
- The document library supports listing, case-insensitive name searching, upload, status display, and selection. It must not display delete, download, or other document actions absent from the backend contract.
- Validate files in the browser before creating an upload record: accept only PDF, DOCX, and TXT files and reject files larger than 100 MB.
- Implement a frontend-managed upload queue. Each file independently follows the existing sequence: create an upload record, upload directly to S3 with the returned presigned form data, confirm the upload, and then observe processing status. The frontend may execute up to three upload sequences concurrently.
- Represent queue states separately from persisted document states. Queue states include waiting, uploading, processing, ready, and failed; persisted document status remains the backend source of truth.
- Poll the document library every five seconds while any document is `PENDING` or `PROCESSING`. Stop polling when no document is in either state or when the relevant workspace lifecycle ends. A failed polling request displays recoverable feedback and does not block later polling.
- Extend document processing with a terminal `FAILED` status. Processing failures must set this status and store or expose a controlled, user-safe failure reason. `FAILED` documents are not eligible for retrieval or selection. Retrying creates a new upload sequence; no deletion capability is introduced.
- Disable chat creation when the user has no `PROCESSED` documents. Explain how to upload a document rather than allowing an ungrounded attempt.
- A new chat defaults to global retrieval. The user may select any number of their own `PROCESSED` documents before sending the first question. Non-processed documents must be visible but not selectable.
- Treat selected documents as immutable chat metadata after creation. The active chat displays “Búsqueda global” when no document was selected, otherwise it displays the selected document names.
- Retain the existing backend semantics: a global chat retrieves only from eligible documents owned by the authenticated user; a selected-document chat retrieves only within the selected-document boundary; and all answers remain grounded in retrieved content.
- Extend the create-chat response to return the newly created chat identifier and metadata together with the generated answer, so the client can activate the exact chat it created.
- Extend chat retrieval contracts to include selected-document metadata needed for scope display when reopening a chat. The metadata must be limited to documents already authorized for that chat's user.
- Render an optimistic user message and a pending assistant state while the backend processes a question. On failure, retain actionable context and provide a retry action. Do not present fabricated sources or citations because the current backend does not return retrieval-source metadata.
- Show the existing user-scoped usage metrics: prompt tokens, completion tokens, total tokens, and storage megabytes.
- Meet WCAG 2.1 AA-equivalent baseline behavior: keyboard navigation, focus visibility, semantic labels, status announcements, contrast, and status cues that do not rely on color alone.

## Testing Decisions

- Test observable behavior at the highest practical seam; do not assert private hook or component implementation details.
- Use feature-hook interfaces as the primary frontend test seams for authentication/session restoration, document listing and polling, upload queue behavior, chat lifecycle, and usage loading.
- Use an HTTP adapter double to simulate backend successes, authorization failures, refresh outcomes, pagination, processing-state transitions, and controlled failures. Tests must not use live network, S3, database, or third-party services.
- Add integration-style UI coverage for registration, sign-in, automatic session restoration, sign-out, password-reset request and confirmation, and protected-route redirects.
- Cover the upload sequence from client validation through presigned upload submission and confirmation. Verify individual queue state transitions, the three-upload concurrency limit, failures, retries, and five-second polling behavior.
- Cover library search, “Cargar más”, non-selectability of `PENDING`, `PROCESSING`, and `FAILED` documents, and chat creation disabled when no `PROCESSED` documents exist.
- Cover global and selected-document chat creation, visible immutable scope metadata, immediate activation of the server-created chat, history loading, older-message loading, pending-answer feedback, and recoverable message errors.
- Verify that the HTTP adapter performs at most one refresh attempt for an authentication failure, restores sessions only through the refresh-cookie flow, and does not persist access tokens in browser storage.
- Verify accessible names, keyboard operation, focus behavior, and status/error announcements for the core user flows.
- Extend backend behavior-focused tests for the `FAILED` processing transition, safe failure reason exposure, CORS origin configuration, and the new chat metadata response contracts.
- Follow the repository testing convention: frontend unit and integration tests live under `frontend/tests/` mirroring source modules, and frontend end-to-end tests live under `frontend/test/`. Keep tests isolated and mock all external systems.

## Out of Scope

- A public marketing or landing page.
- Languages other than Spanish.
- Native mobile applications.
- Document deletion, download, preview, sharing, folders, tags, or document editing.
- Changing a chat's selected documents after its first message.
- Citations, source links, retrieved chunk display, or generated source metadata.
- Streaming model responses or real-time push notifications.
- Backend endpoints or UI controls not needed for the agreed authentication, document, chat, usage, and reliability flows.
- Billing, quotas, alerts, or usage enforcement.
- Full localization infrastructure.
- Persisting access tokens in localStorage, sessionStorage, or another browser storage mechanism.

## Further Notes

- The document lifecycle is `PENDING`, `PROCESSING`, `PROCESSED`, and `FAILED`. Only `PROCESSED` documents are eligible for retrieval.
- The global-chat exception is intentional: no selected documents means global retrieval across the authenticated user's eligible documents, never across another user's data.
- The selected-document boundary remains a hard retrieval constraint whenever a chat has selected documents.
- The frontend must remain honest about backend capabilities. It should offer polished loading, empty, error, and retry experiences but must not imply unavailable operations or unsupported source attribution.
- Existing chat architecture should preserve the established vertical-slice organization. The backend additions are contract and reliability changes, not a reorganization of the chat module.
