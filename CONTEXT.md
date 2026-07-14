# CONTEXT.md

## Product Purpose

DocChat is a RAG-powered document question-answering system.

The product allows a user to upload private documents, process and index them, and chat with an AI assistant that answers using only the user's selected documents.

The core product value is trustworthy answers grounded in user-owned content, without leaking data across users.

## Core Domain Concepts

### User

A user owns a private set of documents, chats, messages, chunks, and usage data.

The user's data is associated directly with `user_id`. There is no separate workspace entity.

`user_id` is the logical security boundary: the system must never allow one user to read or mutate resources associated with another user.

### Document

A document is a user-owned uploaded file represented by an application record and a file stored in S3.

A document moves through an ingestion and processing lifecycle before it becomes eligible for retrieval.

### Document Library

The document library is the user-scoped view of all non-deleted documents. It supports paginated browsing and case-insensitive partial matching by document name, treating search characters as literal text.

### Document Processing

Document processing is the pipeline that transforms an uploaded document into retrievable knowledge:

1. Text extraction with LlamaParse.
2. Hierarchical chunking.
3. Embedding generation with OpenAI embeddings.
4. Vector indexing in PostgreSQL with pgvector.

### Chunk

A chunk is a retrievable unit of document content produced during processing.

Chunks exist only in the context of a source document and inherit its ownership boundary.

### Chat

A chat is a multi-turn conversation session associated with one user and optionally one or more selected documents owned by that same user.

When a chat has selected documents, they define the retrieval boundary for its answers. A chat without selected documents uses global retrieval across the user's eligible documents.

### Message

A message is a user or assistant utterance inside a chat.

Assistant messages must be grounded in retrieved content from the chat's selected documents.

### Token Usage

Token usage is the amount of input and output text processed by a chat model interaction for a user.

Token usage is scoped by user and excludes embedding generation.

### Storage Usage

Storage usage is the total size of a user's non-deleted documents stored in S3.

Storage usage is reported in megabytes and is scoped by user.

Storage usage includes every non-deleted document regardless of its processing status.

### Retrieval

Retrieval is the process of finding relevant chunks from the selected ready documents for the current user question, using the current question together with relevant conversation history.

### Grounded Answer

A grounded answer is an assistant response supported only by retrieved content from the user's selected documents.

If the retrieved content is insufficient, the assistant should fail conservatively instead of inventing unsupported facts.

## Domain Rules

### User Data Isolation

User data isolation is a hard invariant.

Documents, chunks, chats, messages, and tokens must always be filtered and validated by `user_id`.

The system must never expose or retrieve resources associated with another user's `user_id`.

### Retrieval Eligibility

Only documents with status `PROCESSED` are eligible for retrieval.

Documents in `PENDING` or `PROCESSING` are not valid retrieval sources.

### Strict Grounding

Assistant answers must be grounded exclusively in retrieved content from the documents selected for the chat.

The system must not answer using:

- Documents outside the current chat selection.
- Documents owned by another user.
- Ungrounded model knowledge as a substitute for missing evidence.

### Selected Document Boundary

A chat may reference zero or more selected documents.

When a chat has selected documents, retrieval must stay inside that explicit selection, even if the same user owns other ready documents. When it has none, retrieval may use the user's eligible documents globally.

## Key Workflows

### Document Upload

The upload workflow uses presigned S3 URLs:

1. Backend creates the document record and returns a presigned upload URL.
2. Client uploads the file directly to S3.
3. Client confirms the upload.
4. Backend starts processing the document.

### Document Question Answering

When answering a user message, the system should combine:

1. The current user question.
2. Relevant conversation history.
3. Retrieved chunks from the selected documents only.

### Processing Pipeline

Document processing is asynchronous and must be resilient to failures.

A document should not be treated as searchable until processing finishes successfully.

## Entity Lifecycles

### Document Status

Documents use these processing statuses:

- `PENDING`
- `PROCESSING`
- `PROCESSED`
- `FAILED`

Meaning:

- `PENDING`: the document record exists, but the upload has not yet been confirmed.
- `PROCESSING`: the upload was confirmed and the extraction/indexing pipeline is still running.
- `PROCESSED`: processing finished successfully and the document is eligible for retrieval.
- `FAILED`: processing finished unsuccessfully and the document is not eligible for retrieval.

## System Boundaries

### S3

Uploaded source files are stored in AWS S3.

### Application Database

Application records for users, documents, chats, messages, and related ownership metadata live in the primary database.

### Vector Index

Embeddings and vector search live in PostgreSQL with pgvector.

### Backend Responsibilities

The backend is responsible for authorization, status transitions, processing orchestration, retrieval boundaries, and grounded answer generation.

### Client Responsibilities

The client is responsible for initiating uploads, confirming uploads, selecting documents for a chat, and rendering chat interactions.

## Edge Cases

- A file uploaded to S3 but not confirmed by the client must not be treated as processed or retrievable.
- A document in `FAILED` must not participate in retrieval.
- A chat with selected documents that are not ready must reject them. A global chat may retrieve only eligible documents owned by its user.
- A user without any eligible documents cannot start a chat, because no grounded answer can be produced.
- A request that references another user's document, chunk, chat, or message must be rejected.
- Retrieval should ignore documents not explicitly selected for the chat, even if they belong to the same user.

## Ubiquitous Language

Prefer these terms consistently in code, tests, tickets, and docs:

- `user`
- `document`
- `chunk`
- `chat`
- `message`
- `selected documents`
- `grounded answer`
- `document processing`
- `retrieval`

Avoid drifting to vague alternatives when the precise domain term already exists.
