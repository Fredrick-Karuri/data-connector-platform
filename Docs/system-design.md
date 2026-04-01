# Data Connector Platform: System Design

This system serves as a bridge between various data sources (SQL, NoSQL, OLAP) and a unified editing interface. It focuses on batch processing, data integrity, and secure file-based exports.

## Requirements

* **Functional Requirements (FRs)**  
  * Multi-Source Connectivity: Securely store and test connection strings for PostgreSQL, MySQL, MongoDB, and ClickHouse.  
  * Dynamic Batch Extraction: Fetch data from any connected source using configurable batch sizes (offset/limit or cursor-based).  
  * Unified Editable Grid: A single frontend interface to modify data from different sources regardless of the original schema.  
  * Dual-Persistence Sync: On submission, data must simultaneously update the internal PostgreSQL database and generate a flat-file (JSON/CSV) export.  
  * RBAC File Security: A "User vs. Admin" permission model for accessing generated data files.  
  * Job Tracking: Status updates for extractions (Pending, Processing, Completed, Failed).  
* **Non-Functional Requirements (NFRs)**  
  * Extensibility: Adding a new database type (e.g., Snowflake) should only require adding one new "Driver" class.  
  * Consistency: Use Atomic Transactions in the backend to ensure that if the DB write fails, the file is not saved (and vice-versa).  
  * Responsiveness: Use Optimistic UI updates on the Next.js grid so the user doesn't feel lag while editing rows.  
  * Observability: Basic health checks for each configured database connection.  
  * Portability: The entire stack must be "one-click" deployable via Docker Compose.  
* **System Assumptions**  
  * Schema Flexibility: We assume the data being edited fits into a tabular format for the grid (even for MongoDB’s nested docs).  
  * Batch Limits: To prevent memory overflow, we’ll cap single batch extractions at 100MB or 10,000 rows per request.  
  * Storage: Local disk storage (via Docker volumes) will be used for files for the MVP, rather than S3 or Cloud Storage.  
  * Authentication: We will use JWT (JSON Web Tokens) via DRF for session management and RBAC.

## System Architecture

The architecture is divided into three main zones: the Client Layer (Next.js), the Application Layer (Django \+ Celery), and the Data/Storage Layer (The target databases \+ local files).  
The system follows a Producer-Consumer pattern for data extraction and a Synchronous Transactional pattern for updates.

* Extraction: The Backend acts as a bridge. It doesn't store the source data permanently; it fetches it on demand using a Connector Factory and streams it to the Frontend.  
* State Management: The Frontend (Next.js) holds the "Draft" state of the data. The Backend only sees the data again when a user clicks "Submit."  
* Dual-Persistence: The Backend handles a "Two-Phase" write: first to the relational Database (PostgreSQL) for record-keeping, and second to the File System for the export.

**Request Flow (Step-by-Step)**

* Handshake: The User provides credentials for a source (e.g., MySQL). The Connection Manager validates the link and stores the config.  
* The Fetch: User requests a batch. The Connector Factory identifies the DB type, executes a paginated query, and returns a JSON array.  
* The Edit: The User modifies rows in the Editable Grid. The Frontend tracks "Diffs" (changes) locally.  
* The Sync (Submission):  
  * Phase A: Data is sent to the DRF API.  
  * Phase B: API writes the updated rows to the application's PostgreSQL.  
  * Phase C: API generates a CSV/JSON file and saves it to a protected volume.  
* Access: When a user requests a file, the RBAC Layer checks the FileMetadata table to see if the user's role allows the download.

## 

## 

## Core Components

1. ### Connection Manager (The "Bridge")

   This component serves as the unified interface for interacting with heterogeneous data sources. It is designed to abstract the complexities of different database protocols into a standardized internal API.  
   * **The Factory Pattern Implementation**  
     A ConnectorFactory is utilized to instantiate the appropriate database driver based on the db\_type. This ensures the application layer remains decoupled from specific database implementations.  
     1. Base Abstract Class (BaseConnector): Defines the required interface for all connectors, including connect(), fetch\_batch(query, size, offset), and test\_connection().  
     2. Concrete Drivers:  
        1. PostgresConnector: Utilizes psycopg2 for relational extraction.  
        2. MySQLConnector: Utilizes mysql-connector-python.  
        3. MongoConnector: Utilizes pymongo for document-based retrieval and schema flattening.  
        4. ClickHouseConnector: Utilizes clickhouse-driver for OLAP-speed batching.  
   * Connection Configuration Model  
     Stored in the primary PostgreSQL application database, this model maintains the metadata and credentials required to reach external sources.  
     

| Field | Type | Description |
| :---- | :---- | :---- |
| id | UUID | Primary identifier for the connection. |
| name | String | User-defined label (e.g., "Main Analytics DB"). |
| db\_type | Enum | Supported types: postgres, mysql, mongodb, clickhouse. |
| config | JSONB | Securely stored credentials (host, port, user, password, database). |
| status | String | Result of the most recent health check (Healthy/Offline). |
| last\_tested | DateTime | Timestamp of the last connection verification. |

     

   * Health Check & Validation  
     To ensure reliability, the Connection Manager performs "Heartbeat" checks:  
     1. Validation: Before any batch extraction, the ConnectorFactory runs a lightweight "Ping" (e.g., SELECT 1 for SQL or db.command('ping') for NoSQL).  
     2. Error Handling: Connection failures are caught at the driver level and bubbled up to the status field, preventing the UI from attempting operations on unreachable sources.

**Design Decisions**

* **Why the Factory Pattern?** It satisfies the Extensibility NFR. Adding support for a new database (e.g., Snowflake) requires adding a single driver class without modifying existing API logic.  
* **Why JSONB for Config?** Different databases require different credential structures (e.g., Mongo connection strings vs. SQL host/port). JSONB provides the necessary schema flexibility.

2. ### Batch Extraction Pipeline

   This component handles the movement of data from external sources to the platform's internal state. It is designed to manage the high memory overhead of 100MB+ datasets.  
   * **Extraction Logic**  
     The pipeline uses a Streaming Strategy to prevent the application server from crashing during large transfers.  
     1. Cursor-Based Fetching: Instead of loading 10,000 rows into memory at once, the ConnectorFactory initializes a server-side cursor.  
     2. Chunking: Data is processed in sub-batches (e.g., 1,000 rows at a time).  
     3. Serialization: A transformation layer converts DB-specific types (e.g., MongoDB ObjectId or MySQL Decimal) into standard JSON-compatible formats for the frontend grid.  
   * **Asynchronous Task Management (Celery \+ Redis)**  
     To meet the NFR for responsiveness, extraction is decoupled from the request-response cycle.  
     1. Initiation: The user triggers POST /extract. The API returns a job\_id immediately.  
     2. Task Execution: A Celery worker picks up the job, uses the Connection Manager to talk to the source, and streams the result.  
     3. Status Tracking: The job status (PENDING, PROGRESS, SUCCESS, FAILED) is stored in the ExtractionJob model.  
     4. Completion: Once finished, the worker stores the resulting JSON payload in a temporary Redis cache or a staging table for the frontend to fetch.  
   * **Configuration Model (ExtractionJob)**  
     Tracks the lifecycle of every data pull.  
     

| Field | Type | Description |
| :---- | :---- | :---- |
| job\_id | UUID | Primary identifier. |
| connection\_id | ForeignKey | Links to the Connection Manager config. |
| batch\_size | Integer | User-defined limit (max 10,000). |
| query\_metadata | JSONB | Stores the specific SQL query or Mongo filter used. |
| status | Enum | Current state of the extraction. |
| result\_preview | JSONB | A small snippet of data for the initial grid render. |

     

     **Design Decisions**

   * **Why Celery?** Standard DRF views have a timeout (usually 30-60s). 100MB extractions over slow networks will exceed this. Celery allows the process to run in the background.  
   * **Why Redis for staging?** It provides sub-millisecond retrieval for the frontend once the extraction is complete, acting as a high-speed buffer between the source DB and the UI.

3. ### Editable Grid State

   This component manages the lifecycle of data once it reaches the frontend, focusing on user interaction and the transition from "Raw Data" to "Modified Payload."  
   * **State Management Strategy**  
     To ensure performance with large datasets (100MB / 10k rows), the frontend uses a Local Diff Tracking approach rather than sending every keystroke to the backend.  
     1. Initial Load: The grid is populated with the result of the Batch Extraction Pipeline.  
     2. Dirty State Tracking: The system maintains a "Diff Map" of changes.  
        1. Structure: { "row\_id": { "field\_name": { "old": "val", "new": "updated\_val" } } }  
     3. Optimistic Updates: The UI reflects changes immediately. Validation (e.g., checking for nulls or type mismatches) is performed locally before the "Submit" button is enabled.  
   * **Grid Features (Next.js \+ TanStack Table)**  
     The implementation utilizes TanStack Table for its headless state logic, allowing for high-performance rendering.  
     1. Inline Editing: Cells transform into input fields (text, number, or boolean) based on the inferred data type from the source.  
     2. Row-Level Updates: Users can mark rows as "Updated" or "Pending Deletion."  
     3. Conflict Resolution: If multiple users were to edit the same batch, the frontend tracks a version timestamp to ensure the "Last Write Wins" or to warn about potential overwrites.  
   * **Data Normalization Layer**  
     Since the grid receives data from diverse sources (SQL vs. NoSQL), a normalization step is required before display:  
     1. Flattening: Nested MongoDB documents are flattened into a dot-notation format (e.g., user.profile.name → user\_profile\_name) to fit the tabular grid.  
     2. Type Casting: Ensures that dates and numbers from different DB drivers are formatted consistently for the React components.  
   * **MongoDB Array Handling (Normalization)**  
   * Handling NoSQL data in a relational grid requires a flattening strategy. Nested arrays and objects are converted into a flat key-value structure using dot-notation.  
   * **Normalization Logic (Python):**

| def flatten\_mongo\_doc(doc, prefix=''):    items \= {}    for key, value in doc.items():        new\_key \= f"{prefix}{key}" if prefix else key                \# Handle ObjectIDs and Dates (BSON to JSON)        if key \== '\_id':            items\[new\_key\] \= str(value)        \# Handle Nested Arrays/Objects        elif isinstance(value, dict):            items.update(flatten\_mongo\_doc(value, f"{new\_key}\_").items())        elif isinstance(value, list):            \# Convert arrays to comma-separated strings or indexed keys            items\[new\_key\] \= ", ".join(\[str(i) for i in value\])        else:            items\[new\_key\] \= value    return items |
| :---- |

     **Design Decisions**

     1. **Why Local Diff Tracking?** Sending individual updates for every cell edit would create unnecessary network overhead and database load. Collecting all changes into a single "Submit" event is more efficient for batch ETL.  
     2. **Why Next.js?** It provides a robust environment for managing complex frontend states while allowing for Server-Side Rendering (SSR) of the initial connection dashboard for faster perceived load times.

4. ### Dual Storage Strategy

   This component ensures data integrity and persistence by simultaneously updating the application database and generating a physical file export. It is the "Action" phase of the system.  
   * **Transactional Submission Flow**  
     When the user submits the modified grid data, the backend executes a synchronized write sequence to maintain consistency between the database and the file system.  
     1. Validation Layer: The Django REST Framework (DRF) performs a final schema check against the incoming JSON payload (data types, mandatory fields).  
     2. Database Persistence (Structured):  
        1. The updated records are saved to the App PostgreSQL database.  
        2. This allows for historical tracking, auditing, and future re-editing within the platform.  
     3. File Generation (Unstructured):  
        1. A serialization engine converts the JSON payload into the user’s requested format (JSON or CSV).  
        2. Metadata Injection: The system appends a header/footer containing source\_db\_id, extracted\_at\_timestamp, and user\_id.  
     4. Storage Execution: The file is written to a Protected Volume (Docker-mounted storage) with a unique, non-guessable filename (UUID).  
   * **Storage Mapping Model (FileMetadata)**  
     A relational entry is created in PostgreSQL to link the physical file to the system's logic and the user who created it.  
     

| Field | Type | Description |
| :---- | :---- | :---- |
| file\_id | UUID | Primary key and filename on disk. |
| file\_path | String | Absolute path to the file in the storage volume. |
| format | Enum | CSV or JSON. |
| owner\_id | ForeignKey | Links to the User who triggered the submission. |
| source\_metadata | JSONB | Details about the origin (e.g., "Extracted from MySQL Production"). |
| checksum | String | SHA-256 hash to ensure the file hasn't been tampered with. |

* **Consistency Guarantee**  
  To prevent "Partial Success" (where a DB record is saved but the file fails, or vice-versa):  
  1. Atomic Transactions: The DB write is wrapped in transaction.atomic().  
     2. Cleanup Logic: If the file system write fails, the database transaction is rolled back. If the DB write fails, the temporary file is deleted before the response is sent to the user.

     **Design Decisions**

     1. **Why DB \+ File?** The DB allows for internal application features (search, filtering, history), while the File meets the ETL requirement for external portability and backup.  
     2. **Why UUID filenames?** It prevents "Insecure Direct Object Reference" (IDOR) attacks, ensuring users cannot guess the names of other users' files on the server.

5. ### File Access Control (RBAC)

   This component governs the security of the physical files generated in the Dual Storage Strategy. It ensures that data remains isolated between users while providing administrative oversight.  
* **Access Level Definition**

  The system implements a hierarchical Role-Based Access Control (RBAC) model to distinguish between standard users and system administrators.

  * Admin Role: Grants unrestricted access to all files in the system, regardless of ownership. Admins can view metadata, download files, and monitor the global extraction history.  
  * User Role: Restricts access to a "Self-Service" scope. Users can only see and download files they created (owner\_id \== request.user.id) or files explicitly shared with them.  
* **Permission Check Layer (The "Gatekeeper")**

  Files are not served via a public URL. Instead, they are protected by a dedicated Django view that performs a multi-step verification before streaming the data.

  * Request Initiation: The user requests a file via GET /files/{file\_id}/download/.  
  * Metadata Lookup: The system retrieves the corresponding FileMetadata record from the application database.  
  * Authorization Logic:  
    * If request.user.is\_admin, access is granted.  
    * If file.owner\_id \== request.user.id, access is granted.  
    * If the user is found in the shared\_with\[\] array, access is granted.  
    * Otherwise, a 403 Forbidden response is returned.  
  * Secure Streaming: Upon successful authorization, the file is served using Django’s FileResponse, which streams the file in chunks to minimize memory usage on the backend.  
* **Permission Model (FileAccessControl)**

  Manages the relationship between files and users beyond the initial owner.


| Field | Type | Description |
| :---- | :---- | :---- |
| id | UUID | Primary identifier. |
| file\_metadata\_id | ForeignKey | Links to the physical file record. |
| user\_id | ForeignKey | The user receiving access. |
| access\_level | Enum | VIEWER, DOWNLOADER |
| granted\_at | DateTime | Timestamp of the access grant. |


  **Design Decisions**

* **Why a Middleware/View Check?** Placing files in a public folder (like /media/) makes them vulnerable to URL guessing. A view-based check ensures every single download is authenticated and authorized.  
* **Why RBAC over ACL?** Role-based access is easier to scale for a platform where "Admin" and "User" roles are clearly defined, reducing the complexity of managing individual permissions for every file.


  

## Database Selection and Schema Overview

This section outlines the internal storage strategy for the platform itself, distinct from the external data sources it connects to.

* **Internal Database Selection: PostgreSQL**

  PostgreSQL is chosen as the primary application database for its robust support of ACID transactions and JSONB indexing.

  * Relational Integrity: Essential for managing users, roles, and file ownership (RBAC).  
  * Schema Flexibility: JSONB allows storing varying connection credentials (MySQL vs. MongoDB) and row-level "diffs" without complex migrations.  
* **Core Schema Models**


| Table Name | Key Fields | Purpose |
| :---- | :---- | :---- |
| Users | id, username, password\_hash, role (Admin/User) | Identity and RBAC. |
| Connections | id, name, db\_type, credentials (JSONB), status | Stores source DB configurations. |
| ExtractionJobs | id, connection\_id, status, batch\_size, started\_at | Tracks background ETL tasks. |
| ProcessedRecords | id, job\_id, data (JSONB) | Stores the actual data rows pulled. |
| FileMetadata | id, owner\_id, file\_path, format, checksum | Tracks physical files on disk. |
| FileSharing | id, file\_id, user\_id, permission\_type | Manages "Shared with Me" logic. |


* **Indexing Strategy**

  To maintain sub-millisecond retrieval as the platform scales:

  * B-Tree Index: On owner\_id in the FileMetadata table to speed up the "My Files" dashboard.  
  * GIN Index: On the credentials JSONB column in the Connections table to allow fast lookups of specific connection types.  
  * Composite Index: On (job\_id, status) to efficiently monitor active background extractions.

  **Design Decisions**

* **Why not NoSQL for the internal DB?** Since the platform relies heavily on Relational Logic (linking Users to Connections to Files), a relational DB prevents orphaned records and ensures data consistency during deletions.  
* **Why JSONB for Records?** Because the data coming from a MySQL source will have a different schema than data from ClickHouse. JSONB allows the ProcessedRecords table to store any structure while still being searchable.

## Docker Infrastructure and Deployment Strategy

This component defines the containerized environment required to run the platform and its auxiliary database services. It ensures the "one-click" setup requirement of the assessment.

* **Container Orchestration (Docker Compose)**  
  The platform is decomposed into independent services, each specialized for a specific role in the ETL pipeline.  
  * Web Service ([Next.js](http://Next.js)):  
    * Handles the UI, grid state, and client-side validation.  
    * Communicates with the Backend via an internal Docker network.  
  * API Service (DRF):  
    * The core business logic engine.  
    * Manages authentication, RBAC, and triggers background jobs.  
  * Worker Service (Celery):  
    * A headless instance of the Django app dedicated to long-running extractions.  
    * Isolated from the API to prevent extraction spikes from slowing down the UI.  
  * Broker (Redis):  
    * Acts as the message transport for Celery and the temporary cache for batch data.  
  * Application Database (PostgreSQL):  
    * The persistent store for metadata, user roles, and file records.  
  * Mock Sources (Postgres, MySQL, Mongo, ClickHouse):  
    * Pre-configured containers with sample data to allow immediate testing of the "Multi-Database Connector" logic.  
* **Networking and Volumes**  
  * Internal Network: All backend services (API, Worker, DBs) sit on a private network, unreachable from the outside world.  
  * Persistence (Volumes):  
    * postgres\_data: Ensures application metadata persists across container restarts.  
    * file\_exports: A shared volume between the API (to write files) and the Worker (if it handles the file generation).  
* **Deployment Workflow**  
  To deploy the platform locally for the assessment walkthrough:  
  * Build: docker-compose build assembles the custom Next.js and Django images.  
  * Up: docker-compose up \-d starts the environment.  
  * Seed: A management command (python manage.py seed\_data) populates the mock source databases with test records for the grid.  
    

**Design Decisions**

* **Why a Separate Worker?** Scaling. If the system needs to handle 100 concurrent 100MB extractions, we can spin up 10 Worker containers without needing to scale the Web or API layers.  
* Why Local Volumes? For a local development assessment, volumes provide the simplest path to "Dual Storage" without requiring external cloud provider (AWS/GCP) credentials.

## Unit Testing Strategy

The system employs a multi-layered testing approach focusing on data integrity and connector reliability.

* **Backend (Django) Test Suites**  
  * Connector Logic: Tests the BaseConnector implementations. Each driver (Postgres, Mongo, etc.) is tested against a mock database to verify fetch\_batch returns standardized JSON.  
  * RBAC Middleware: Verification that a User role receives a 403 Forbidden when attempting to access a file\_id owned by another user.  
  * Atomic Transactions: A test case that intentionally fails the file-write step to ensure the database record is correctly rolled back.  
* **Frontend (Jest/React Testing Library)**  
  * Grid State: Verifies that editing a cell correctly updates the "Local Diff Map" without triggering a re-fetch.  
  * Validation Rules: Ensures the "Submit" button remains disabled if a mandatory field (e.g., a non-nullable SQL column) is left empty in the grid.

## Mock Data Seed Specification

Each container in the docker-compose stack is pre-seeded with specific data types.

| Source DB | Table/Collection | Sample Data Context | Unique Type Test |
| :---- | :---- | :---- | :---- |
| PostgreSQL | inventory\_items | Standard ERP data (SKU, Price, Stock) | UUIDs & Timestamps |
| MySQL | customer\_leads | CRM data (Email, Name, Phone) | Varchar & Booleans |
| MongoDB | user\_logs | Nested activity logs (User, Actions\[\]) | Arrays & Nested Objects |
| ClickHouse | sensor\_readings | High-volume telemetry (Temp, Humidity) | Int64 & Large Batches |

* **Seeding Mechanism:**  
  A setup\_sources.sh script runs during the docker-compose up phase, executing SQL/NoSQL scripts to ensure the environment is "Ready to Extract" immediately upon launch.

## Project Folder Structure

The repository follows a clean separation of concerns, housing the core application logic within an app/ directory while keeping configuration and orchestration at the root.

| data-connector-platform/ ├── app/                        \# Main Application Source │   ├── backend/                \# Django REST Framework (DRF) │   │   ├── core/               \# Project settings & WSGI │   │   ├── api/                \# Views, Serializers, & RBAC Logic │   │   ├── connectors/         \# Factory Pattern (Postgres, Mongo, etc.) │   │   │   ├── base.py         \# Abstract BaseConnector class │   │   │   └── drivers/        \# DB-specific implementations │   │   ├── services/           \# Business Logic (SRP: Processing & Validations) │   │   ├── tasks/              \# Celery tasks for batch extraction │   │   └── tests/              \# Unit & Integration tests │   └── frontend/               \# Next.js Application │       ├── components/         \# Grid (TanStack) & UI (Shadcn) │       ├── hooks/              \# Diff-tracking & State logic │       └── services/           \# API Client (Axios/Fetch) ├── scripts/                    \# Mock DB Seeding (SQL/NoSQL) ├── storage/                    \# Shared volume for JSON/CSV exports ├── docker-compose.yml          \# Full stack orchestration ├── Makefile                    \# Shortcuts for build, test, and seed commands ├── pytest.ini                  \# Test runner configuration ├── .gitignore                  \# Version control exclusions └── README.md                   \# Setup instructions and Design docs  |
| :---- |

**Design Decisions**

* **The app/ Directory:** Isolating the frontend and backend code simplifies Docker build contexts and provides a clear boundary for the "Application" vs. "Infrastructure."  
* **The services/ Folder (Backend):** Adhering to the Single Responsibility Principle (SRP), we move complex logic (like the "Dual Storage" write sequence or complex data transformations) out of the Views and into dedicated Service classes. This makes the code highly testable.  
* **Root Makefile:** Provides a unified interface for the developer to interact with the containerized environment (e.g., make test, make build, make seed).  
* **pytest.ini at Root:** Enables running the entire test suite (including connector tests and API tests) from a single command while managing environment variables for the mock databases.

## 

## API Endpoint Specifications

These endpoints facilitate the handshake between the frontend grid and the backend's dual-storage logic.

* **Connection Management**  
  * GET /api/connections/: List all configured source databases.  
  * POST /api/connections/test/: Validates credentials using the Connector Factory before saving.  
* **Extraction & Grid Data**  
  * POST /api/extract/  
    * Body: { connection\_id, query, batch\_size }  
    * Action: Returns a job\_id and triggers a Celery background task.  
  * GET /api/jobs/{job\_id}/: Polls the status and retrieves the extracted data once SUCCESS.  
* **Data Submission (The "Sync" Path)**  
  * POST /api/submit-batch/  
    * Body: { job\_id, original\_data, modified\_data, format: "csv"|"json" }  
    * Action:  
      * Validates the "Diff Map."  
      * Executes transaction.atomic() to update the App DB.  
      * Generates the physical file in the /storage/ volume.  
* **File Access & RBAC**  
  * GET /api/files/: Lists files available to the current user (Owner or Shared).  
  * GET /api/files/{file\_id}/download/:  
    * Action: Backend checks request.user.role. If authorized, it streams the file via FileResponse.

**Design Decisions**

* **Why a /scripts/ folder?** It keeps the Docker images "production-ready" while allowing local development to pre-populate the 4 Mock DBs (Postgres, MySQL, Mongo, ClickHouse) automatically.  
* **Why use job\_id for submissions?** By referencing the original job\_id, the backend can audit exactly where the data came from and verify that the user hasn't tampered with the immutable metadata during the editing process.

## Error Handling & Resilience

This section defines how the platform maintains stability when interacting with external, potentially unstable database sources and how it communicates failures to the user.

* **Categorized Exception Strategy**  
  The system uses a custom exception hierarchy to differentiate between user errors and infrastructure failures.


| Category | Trigger Example | System Response |
| :---- | :---- | :---- |
| ConnectionError | Invalid credentials or DB is offline. | 400 Bad Request: "Source Unreachable" |
| ExtractionError | SQL syntax error or Mongo timeout. | 422 Unprocessable Entity: "Query Failed" |
| TransformationError | Normalization fails for a specific row. | Log skip: Flag row as "Unreadable" in UI |
| PersistenceError | Disk full or DB constraint violation. | 500 Internal Error: Trigger Transaction Rollback |


* **The "Circuit Breaker" Pattern**  
  To prevent a single slow database (e.g., a massive ClickHouse query) from hanging the entire worker pool:  
  * Timeouts: Every extraction task has a strict 60-second execution limit at the Celery level.	  
  * Retry Logic: If a connection fails due to a network blip, the task retries 3 times with exponential backoff before marking the ExtractionJob as FAILED.  
* **Frontend Error Boundary**  
  The Next.js application implements an "Error Boundary" around the Editable Grid.  
  * Visual Feedback: If the JSON data from the backend is malformed, the grid displays a fallback UI: "Data Format Incompatibility Detected."  
  * Validation Toasts: When clicking "Submit," if the DRF backend returns a 400 (e.g., type mismatch), the specific row ID and error message are highlighted in red on the grid.  
* **Data Integrity Cleanup**  
  In the Dual Storage Strategy, if the file system fails after the database has already been updated:  
  * Signal: A post\_save signal or manual try/except block catches the IOError.  
  * Rollback: The system triggers transaction.set\_rollback(True) to undo the database changes.  
  * Audit: The error is logged to a SystemLogs table for Admin review, ensuring no "phantom" database records exist without a corresponding file.


  **Design Decisions**

* **Why Exponential Backoff?** It prevents "Thundering Herd" issues where the platform repeatedly hammers a database that is already struggling to stay online.  
* **Why Row-Level Highlighting?** In a 10,000-row batch, a single error shouldn't force the user to guess which record caused the failure. Explicit error mapping in the API response is essential for the UX.