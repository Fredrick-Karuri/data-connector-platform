# Architecture Decision Records
## Data Connector Platform

| Field | Details |
|-------|---------|
| **Project** | Full-Stack Assessment — Data Connector Platform |
| **Author** | Fredrick Karuri |
| **Date** | 11 April 2026 |
| **Version** | 1.0 |

This document records the seven key architectural decisions made during the design and implementation of the Data Connector Platform. Each record follows the format: context (the problem), alternatives considered, the decision taken, and its consequences.

---

## ADR-001 — Factory Pattern for Database Connectors

**Status:** Accepted

### Context
The assessment requires connectivity to four distinct database engines — PostgreSQL, MySQL, MongoDB, and ClickHouse — each with different client libraries, connection semantics, and query interfaces. The application layer must be able to reach any of them without being aware of which specific engine it is talking to.

### Alternatives Considered
- Direct if/elif branching in the view layer based on `db_type`
- A single generic connector using a lowest-common-denominator interface
- Factory Pattern with abstract base class and concrete driver implementations

### Decision
A `ConnectorFactory` class maps a `db_type` string to a concrete driver class via a `DRIVER_MAP` dictionary. Every driver extends `BaseConnector`, an abstract class that mandates `connect()`, `fetch_batch()`, `fetch_chunks()`, and `test_connection()` methods. The factory uses Python's `importlib` to lazy-load the driver at runtime.

### Consequences
- ✅ Adding Snowflake or any fifth database requires writing one new file (the driver) and adding one line to `DRIVER_MAP`. No other files change.
- ✅ Each driver can be unit-tested in complete isolation with a mocked connection.
- ✅ The API layer is fully decoupled from database-specific code.
- ❌ Slight indirection — developers must look up `DRIVER_MAP` to understand which class handles a given `db_type`.

---

## ADR-002 — JSONB for Connection Credentials Storage

**Status:** Accepted

### Context
Different database types require different credential structures. A SQL database needs host, port, user, password, and database name. MongoDB uses a single URI string. ClickHouse has additional driver-specific settings. A rigid relational schema would require either a separate credentials table per database type or a complex polymorphic schema — both requiring migrations when new types are added.

### Alternatives Considered
- Separate credentials table per database type
- Single table with nullable columns for every possible field
- Encrypted flat text field storing serialised JSON
- JSONB column on the Connection model

### Decision
A JSONB column named `config` on the `Connection` model stores credentials. PostgreSQL's JSONB type is fully queryable, supports GIN indexing, and allows any shape of credential object without schema migrations.

### Consequences
- ✅ Adding a new database type with different credential fields requires zero schema migrations.
- ✅ GIN index on the `config` column allows fast lookups by database type.
- ✅ DRF serializer validates required keys per `db_type` at the application layer before any write.
- ❌ No database-level constraints on credential fields — validation is purely application-enforced.

---

## ADR-003 — Celery + Redis for Batch Extraction

**Status:** Accepted

### Context
Extracting up to 100MB or 10,000 rows from a remote database over a slow network can take well beyond the 30–60 second HTTP timeout imposed by Django and standard reverse proxies. Blocking the request-response cycle would result in timeouts and poor user experience.

### Alternatives Considered
- Synchronous extraction in the Django view with an extended timeout
- Django Channels with WebSocket streaming
- Celery workers with Redis as the message broker

### Decision
`POST /api/extract/` creates an `ExtractionJob` record in `PENDING` state and immediately enqueues a Celery task, returning the `job_id` to the client in under 100ms. A dedicated Celery worker container processes the job using server-side cursor streaming in chunks of 1,000 rows. The frontend polls `GET /api/jobs/{id}/` every two seconds until `SUCCESS` or `FAILED`.

### Consequences
- ✅ The API never blocks — the user gets a response immediately regardless of extraction size.
- ✅ The Worker container can be scaled independently of the API container.
- ✅ A 60-second hard time limit and three exponential-backoff retries prevent runaway jobs.
- ❌ Additional infrastructure complexity — Redis and Celery must be running for extractions to work.
- ❌ Result state lives in Redis with a 2-hour TTL; expired results fall back to the smaller `result_preview` stored in the database.

---

## ADR-004 — Atomic Transactions for Dual Storage

**Status:** Accepted

### Context
The assessment requires every submission to be saved in two places simultaneously: structured rows in the PostgreSQL application database, and a flat-file export (JSON or CSV) on disk. Without coordination, a partial write is possible — the database record saves but the file write fails, leaving the system in an inconsistent state with no export file for a record that claims one exists.

### Alternatives Considered
- Sequential writes with manual cleanup on failure
- Two-phase commit protocol
- Django `transaction.atomic()` with explicit rollback on file failure

### Decision
The entire submission is wrapped in Django's `transaction.atomic()`. Phase B (`ProcessedRecord` bulk write) and Phase D (`FileMetadata` creation) are inside the transaction. Phase C (file write to disk) happens inside the same block. If the file write raises an `OSError`, `transaction.set_rollback(True)` is called and any partially-written file is deleted. If the database write fails, the temporary file is deleted in the exception handler before re-raising.

### Consequences
- ✅ The system is always consistent — either both the DB record and the file exist, or neither does.
- ✅ No orphaned database records pointing to non-existent files.
- ✅ Fully testable — a unit test mocks the file write to raise `OSError` and asserts zero `ProcessedRecord` and `FileMetadata` rows remain.
- ❌ A very large file write holds the database transaction open longer than a pure DB operation would.

---

## ADR-005 — UUID Filenames to Prevent IDOR Attacks

**Status:** Accepted

### Context
Export files are stored on a Docker volume and served by Django. If files were named with sequential integers or user-readable names, an authenticated user could enumerate or guess another user's filename and bypass the access control check by requesting the file directly.

### Alternatives Considered
- Sequential integer filenames with strict view-layer access checks
- User-prefixed filenames (`user_id/filename`)
- UUID v4 filenames with view-layer access checks

### Decision
Every file is stored using its `FileMetadata` primary key, which is a UUID v4, as the filename. The file path is never returned to the client — only the `file_id`. Downloads are served exclusively through `GET /api/files/{file_id}/download/`, which performs a three-step RBAC check before streaming. The `file_path` column is explicitly excluded from the `FileMetadataSerializer`.

### Consequences
- ✅ Eliminates Insecure Direct Object Reference (IDOR) risk — filenames are cryptographically unguessable.
- ✅ Access is always checked server-side regardless of how a user obtained a `file_id`.
- ❌ Files are not human-readable on disk without looking up the database record.

---

## ADR-006 — Local Diff Tracking on the Frontend

**Status:** Accepted

### Context
The editable grid can hold up to 10,000 rows. Sending every keystroke or cell change to the backend would generate excessive network traffic, create unnecessary database load, and make the grid feel sluggish. Users expect spreadsheet-like responsiveness.

### Alternatives Considered
- Optimistic updates with per-keystroke PATCH requests
- Debounced auto-save every N seconds
- Local diff map in React state, single submit on user action

### Decision
A `useDiffTracker` hook maintains a `DiffMap` in React state with the shape `{ row_id: { field_name: { old: value, new: value } } }`. Cell edits update the map immediately with no network call. The grid reflects changes optimistically. The backend only receives data when the user explicitly clicks Submit, at which point the full `original_data` and `modified_data` arrays are sent in a single `POST /api/submit-batch/` request.

### Consequences
- ✅ Zero network overhead during editing — the grid is as fast as a local spreadsheet.
- ✅ The diff map enables precise change tracking, row-level validation, and a meaningful dirty-state indicator.
- ✅ Reverting a cell to its original value automatically removes it from the diff map, keeping the payload clean.
- ❌ Unsaved changes are lost on page refresh — there is no auto-save to the backend.

---

## ADR-007 — Role-Based Access Control over ACL

**Status:** Accepted

### Context
The assessment defines two access levels: Admin (full access to all files and connections) and User (access limited to their own files plus any files explicitly shared with them). A per-resource Access Control List would require managing individual permission entries for every resource and every user combination.

### Alternatives Considered
- Per-resource Access Control List (ACL) on every file and connection
- Attribute-Based Access Control (ABAC) with policy rules
- Role-Based Access Control (RBAC) with two roles and a sharing table

### Decision
Two roles are defined at the user level: `admin` and `user`. The role is embedded as a claim in the JWT payload at login, eliminating per-request database lookups for basic access checks. A `FileAccessControl` join table handles the `shared_with[]` case for files. The download gatekeeper checks three conditions in order: `is_admin`, `owner_id == request.user`, and `FileAccessControl.objects.filter(file=file, user=user).exists()`.

### Consequences
- ✅ Simple to reason about — every permission decision reduces to three clearly ordered checks.
- ✅ Role is carried in the JWT, so basic access decisions require no extra database query.
- ✅ The sharing table handles granular delegation without complicating the core role model.
- ❌ Adding a third role (e.g. Manager) would require schema and application changes.