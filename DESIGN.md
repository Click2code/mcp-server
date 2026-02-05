# Prior Authorization System — Design & Architecture Document

## 1. System Overview

An end-to-end **Prior Authorization (PA)** decision-support system that demonstrates how a multi-agent AI pipeline, backed by an **MCP (Model Context Protocol) Tool Registry** and **PostgreSQL database**, can automate the intake, clinical review, and determination of prior authorization requests.

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                       │
│  Login → Dashboard → Request Detail (Workflow + Trace Panes)   │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST API (JSON)
┌──────────────────────────▼──────────────────────────────────────┐
│                  Express.js Backend (ESM)                        │
│  Routes: /auth  /requests  /mcp                                 │
│  Middleware: JWT Authentication                                  │
├─────────────────────────────────────────────────────────────────┤
│                    Pipeline Processor                            │
│  Sensing → Planning → Orchestrator → Decision                   │
│  (4 Agents that reason + decide)                                │
├─────────────────────────────────────────────────────────────────┤
│                   MCP Tool Registry                             │
│  6 Registered Tools (passive executors, DB-backed)              │
│  IDP │ Clinical Extract │ Eligibility │ Claims │ NCD │ Policy   │
├─────────────────────────────────────────────────────────────────┤
│                    PostgreSQL (prior_auth_db)                    │
│  members │ claims │ coverage_policies │ prior_auth_requests     │
│  workflow_steps │ trace_logs                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Principle: Agents vs. Tools

| Concept | Role | Count | Behavior |
|---------|------|-------|----------|
| **Agents** | Reason, plan, decide | 4 | Active — analyze context and make decisions |
| **MCP Tools** | Execute specific tasks | 6 | Passive — invoked by agents, return structured data |

Agents **think**; tools **do**. This separation keeps business logic (coverage rules, clinical criteria) inside tools and data, while agents provide the reasoning and orchestration layer.

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite + Tailwind CSS + shadcn/ui | React 18, Vite 6 |
| Backend | Express.js (ESM modules) | Express 4.x |
| Database | PostgreSQL | 16.x |
| Auth | JSON Web Tokens (JWT) | jsonwebtoken |
| PDF Generation | PDFKit | pdfkit |
| IDs | UUID v4 | uuid |

---

## 3. Database Architecture

### Database: `prior_auth_db`

Six tables with 24 indexes, GIN indexes for array fields, and JSONB for flexible policy criteria.

### 3.1 Entity Relationship

```
members ──< claims              (member_id FK)
members ──< prior_auth_requests (member_id FK)
prior_auth_requests ──< workflow_steps  (request_id FK)
prior_auth_requests ──< trace_logs      (request_id FK)
coverage_policies (standalone — joined by procedure/diagnosis codes)
```

### 3.2 Table Details

#### `members` — Member 360 Data Product
Stores comprehensive member demographics, plan enrollment, and benefits data.

| Column | Type | Purpose |
|--------|------|---------|
| member_id | VARCHAR(20) UNIQUE | Business key (MEM123456789) |
| plan_type, plan_id, group_number | VARCHAR | Insurance plan details |
| copay_primary, copay_specialist | DECIMAL | Cost-sharing amounts |
| deductible_annual, deductible_met | DECIMAL | Deductible tracking |
| max_out_of_pocket, oop_met | DECIMAL | OOP maximum tracking |
| is_active | BOOLEAN | Eligibility flag |
| pre_auth_required | BOOLEAN | Whether PA is needed |
| pcp_name, pcp_npi | VARCHAR | Primary care provider |

**15 member records** with realistic demographics, varied plan types (Gold Plus HMO, Silver PPO, Bronze HDHP, Platinum PPO), and different benefit levels.

#### `claims` — Claims History Data Product
Historical claims for utilization review and pattern analysis.

| Column | Type | Purpose |
|--------|------|---------|
| claim_id | VARCHAR(20) UNIQUE | Business key (CLM-2025-XXXXX) |
| icd10_codes | TEXT[] | Array of diagnosis codes (GIN indexed) |
| cpt_code, cpt_description | VARCHAR | Procedure details |
| billed/allowed/paid_amount | DECIMAL | Financial data |
| claim_status | VARCHAR | paid, denied, pending |
| service_type | VARCHAR | inpatient, outpatient, professional |

**~75 claims** generated programmatically (3-8 per member) covering 12 months of history.

#### `coverage_policies` — NCD/LCD Guidelines
Coverage determination rules stored as flexible JSONB.

| Column | Type | Purpose |
|--------|------|---------|
| policy_id | VARCHAR(20) UNIQUE | Business key (NCD-001, LCD-045) |
| policy_type | VARCHAR | NCD, LCD, or internal |
| procedure_codes | TEXT[] | CPT codes covered (GIN indexed) |
| diagnosis_codes | TEXT[] | Applicable ICD-10 codes (GIN indexed) |
| medical_necessity_criteria | JSONB | Array of criteria to evaluate |
| required_documentation | JSONB | Documents checklist |
| approval_conditions | JSONB | Auto-approve rules |
| denial_conditions | JSONB | Auto-deny rules |
| review_triggers | JSONB | Conditions requiring human review |
| frequency_limits | JSONB | Procedure frequency restrictions |
| conservative_treatment_required | BOOLEAN | Step therapy flag |

**15 coverage policies** spanning MRI, knee replacement, cardiac catheterization, CPAP, physical therapy, chemotherapy, spinal fusion, bariatric surgery, cochlear implant, TAVR, radiation therapy, genetic testing, sleep study, hip replacement, and nerve block.

#### `prior_auth_requests` — PA Request Queue
Core request tracking with lifecycle management.

| Column | Type | Purpose |
|--------|------|---------|
| request_id | VARCHAR(20) UNIQUE | Business key (PA-2026-XXXX) |
| status | VARCHAR | pending → processing → approved/denied/review |
| priority | VARCHAR | high, medium, low |
| document_url | VARCHAR | Path to clinical PDF |
| decision_rationale | TEXT | AI-generated explanation |
| decision_date | TIMESTAMP | When decision was made |

**15 requests** seeded with various statuses and priorities.

#### `workflow_steps` — Pipeline Execution Steps
Records each step the pipeline takes for a given request.

| Column | Type | Purpose |
|--------|------|---------|
| step_number | INTEGER | Execution order |
| tool_name | VARCHAR | MCP tool invoked |
| tool_input | JSONB | Input parameters |
| tool_output | JSONB | Tool response data |
| duration_ms | INTEGER | Execution time |
| status | VARCHAR | completed, in-progress, pending, error |

#### `trace_logs` — Detailed Audit Trail
Chronological log of every action, decision, and data point.

| Column | Type | Purpose |
|--------|------|---------|
| level | VARCHAR | info, success, warning, error |
| category | VARCHAR | agent name, tool name, system |
| message | TEXT | Human-readable description |
| details | JSONB | Structured data for drill-down |

### 3.3 Indexing Strategy

- **B-tree indexes** on all foreign keys and frequently filtered columns (status, priority, member_id)
- **GIN indexes** on TEXT[] array columns (procedure_codes, diagnosis_codes, icd10_codes) for efficient `@>` (contains) queries
- **JSONB** columns are not indexed (low cardinality, read-heavy with small result sets)

---

## 4. MCP Tool Registry

### 4.1 Registry Pattern (`server/mcp/registry.js`)

Singleton registry implementing the MCP tool interface:

```javascript
class MCPToolRegistry {
  registerTool({ name, description, inputSchema, handler })  // Register tool
  callTool(name, params)          // Invoke tool with input validation
  listTools()                     // MCP tools/list — returns all tool definitions
  getToolSchema(name)             // Get single tool's JSON Schema
  unregisterTool(name)            // Remove tool
}
```

Every tool call is logged with input, output, duration, and success/error status.

### 4.2 Standardized DB Layer (`server/mcp/db.js`)

All 6 tools access PostgreSQL through a shared interface:

```javascript
db.query(sql, params)           // Raw query
db.findOne(table, conditions)   // SELECT ... LIMIT 1
db.findMany(table, conditions)  // SELECT ... WHERE
db.insertOne(table, data)       // INSERT ... RETURNING *
db.updateOne(table, conditions, data)  // UPDATE ... RETURNING *
```

### 4.3 The 6 MCP Tools

#### Tool 1: `intelligent-document-processing`
**Purpose**: Extract structured data from clinical PDF documents.
- Reads PDF file from `server/documents/`
- Simulates OCR/NLP extraction of clinical entities
- Returns: patient demographics, diagnoses, procedures, medications, lab results, clinical notes with confidence scores
- **No database query** — works on document files only

#### Tool 2: `clinical-data-extraction`
**Purpose**: NLP entity extraction and medical code validation.
- Takes IDP output as input
- Extracts and validates CPT codes, ICD-10 codes, medication names
- **Queries**: `coverage_policies` to validate that codes exist in the system
- Returns: validated clinical entities, code descriptions, extraction confidence

#### Tool 3: `member-eligibility-lookup`
**Purpose**: Verify member eligibility and benefits.
- **Queries**: `members` table by member_id
- Returns: eligibility status (active/inactive/termed), plan details, copay amounts, deductible status, OOP accumulator, PCP info, PA requirement flag
- Flags potential issues (inactive member, terminated plan, exhausted benefits)

#### Tool 4: `claims-history-retrieval`
**Purpose**: Retrieve claims data and calculate utilization patterns.
- **Queries**: `claims` table filtered by member_id
- Returns: claims array, summary statistics (total claims, total billed/paid), utilization metrics
- Calculates: frequency of related procedures, denial history, recent utilization trends

#### Tool 5: `ncd-guidelines-search`
**Purpose**: Search NCD/LCD coverage guidelines.
- **Queries**: `coverage_policies` table using procedure_codes and diagnosis_codes (GIN index array overlap `&&`)
- Returns: matched policies ranked by relevance, medical necessity criteria, required documentation lists
- Supports filtering by policy_type (NCD, LCD, internal)

#### Tool 6: `policy-criteria-matching`
**Purpose**: Match clinical evidence against coverage policy rules.
- **Queries**: `coverage_policies` for the specific matching policy
- Evaluates each criterion in `medical_necessity_criteria` JSONB against provided clinical evidence
- Checks `approval_conditions`, `denial_conditions`, `review_triggers`
- Returns: determination recommendation (approve/deny/review), criteria match count, rationale, unmet criteria list

---

## 5. Agent Architecture

### 5.1 Pipeline Flow

```
Request submitted (status: pending)
        │
        ▼
┌─── Sensing Agent ───┐   Classifies priority, detects document type,
│   (Triage & Intake)  │   assesses complexity score
└──────────┬───────────┘
           ▼
┌─── Planning Agent ──┐   Determines required tools, builds execution
│   (Strategy)         │   plan with parallel phases
└──────────┬───────────┘
           ▼
┌── Orchestrator Agent ┐   Executes 6 MCP tools across 5 phases:
│   (Execution)         │   Phase 1: IDP (document processing)
│                       │   Phase 2: Clinical data extraction
│                       │   Phase 3: Eligibility + Claims (parallel)
│                       │   Phase 4: NCD guidelines search
│                       │   Phase 5: Policy criteria matching
└──────────┬───────────┘
           ▼
┌─── Decision Agent ──┐   Reviews all tool outputs, makes final
│   (Determination)    │   determination, writes rationale
└──────────┬───────────┘
           ▼
   Decision persisted
   (approved / denied / review)
```

### 5.2 Agent Details

#### Sensing Agent (`server/agents/sensing-agent.js`)
- `classifyPriority()` — Analyzes diagnosis codes and procedure type to assign urgency
- `detectDocumentType()` — Identifies clinical document category (SOAP note, lab report, operative note, etc.)
- `assessComplexity()` — Scores case complexity (1-10) based on number of diagnoses, procedure risk, patient age

#### Planning Agent (`server/agents/planning-agent.js`)
- Determines which of the 6 MCP tools are needed (most requests use all 6)
- Builds execution order with parallel phases (e.g., eligibility + claims can run simultaneously)
- Strategy: `sequential-with-parallel`

#### Orchestrator Agent (`server/agents/orchestrator-agent.js`)
- Calls each MCP tool via `registry.callTool(name, params)`
- Phase 3 runs member eligibility + claims history in parallel via `Promise.all()`
- Creates workflow step records and trace log entries after each tool invocation
- Persists all data to PostgreSQL in real-time

#### Decision Agent (`server/agents/decision-agent.js`)
- Reviews all tool outputs holistically
- Can override policy matching recommendation (e.g., inactive member → deny regardless of clinical match)
- Generates human-readable decision rationale
- Updates request status and decision fields in database

### 5.3 Real-Time Updates

During processing, workflow steps and trace logs are written to the database as they occur. The frontend polls every 2 seconds (silent refresh, no loading spinner) to stream updates to the UI in real-time.

---

## 6. API Design

### Base URL: `/api/v1`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with username/password → JWT token |
| POST | `/auth/logout` | Logout (client-side token removal) |
| GET | `/auth/me` | Get current user profile |

**Demo Users**:
- `admin` / `admin123` — Medical Director
- `nurse` / `nurse123` — Clinical Reviewer
- `analyst` / `analyst123` — Claims Analyst

### Prior Authorization Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/requests` | List all PA requests |
| GET | `/requests/:id` | Get request detail + workflow + trace |
| POST | `/requests/:id/process` | Start pipeline processing |
| PATCH | `/requests/:id` | Update request fields |
| PATCH | `/requests/:id/status` | Update request status |
| POST | `/requests/:id/workflow` | Add/update workflow step |
| POST | `/requests/:id/trace` | Add trace log entry |

### MCP Tool Registry
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mcp/tools` | List all registered tools with schemas |
| GET | `/mcp/tools/:name` | Get single tool definition |
| POST | `/mcp/tools/call` | Invoke a tool directly |
| GET | `/mcp/stats` | Tool invocation statistics |
| GET | `/mcp/call-log` | Recent tool call history |

---

## 7. Frontend Architecture

### 7.1 Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/` | Authentication with role-based demo users |
| Dashboard | `/dashboard` | Request list with search, filter, stats cards |
| Request Detail | `/request/:id` | Split-pane view: workflow (left) + trace (right) |

### 7.2 Key Components

- **EditableWorkflowPane** — Left pane showing pipeline steps with status indicators, expandable details, and inline editing
- **EditableTracePane** — Right pane showing chronological trace logs with level-based color coding, auto-scroll toggle, and filtering

### 7.3 Services

- **api-client.ts** — Axios-based HTTP client with JWT auth headers, error handling, base URL configuration
- **auth-service.ts** — Login/logout/token management (real API calls to backend)
- **request-service.ts** — All PA request CRUD operations and pipeline trigger

### 7.4 Real-Time Processing UX

When a user clicks "Process Request":
1. Frontend calls `POST /requests/:id/process`
2. Backend starts pipeline asynchronously (returns immediately)
3. Frontend detects `status: processing` and begins polling every 2 seconds
4. Polling uses silent refresh (no loading spinner) to keep UI state intact
5. Workflow steps and trace logs appear incrementally as the pipeline progresses
6. When status changes to approved/denied/review, polling stops

---

## 8. Directory Structure

```
Prior Authorization Wireframe/
├── index.html                          # Vite entry point
├── package.json                        # Frontend dependencies
├── vite.config.ts                      # Vite configuration
├── postcss.config.mjs                  # PostCSS + Tailwind
├── .env.local                          # VITE_API_BASE_URL
│
├── src/                                # Frontend source
│   ├── main.tsx                        # React entry
│   ├── styles/                         # CSS (Tailwind, theme, fonts)
│   └── app/
│       ├── App.tsx                     # Root component
│       ├── routes.ts                   # React Router config
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Dashboard.tsx
│       │   └── RequestDetail.tsx
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── WorkflowPane.tsx
│       │   ├── EditableWorkflowPane.tsx
│       │   ├── TracePane.tsx
│       │   ├── EditableTracePane.tsx
│       │   └── ui/                     # 45 shadcn/ui components
│       └── services/
│           ├── api-client.ts
│           ├── auth-service.ts
│           └── request-service.ts
│
├── server/                             # Backend source
│   ├── index.js                        # Express entry, tool registration
│   ├── package.json                    # Backend dependencies
│   ├── db/
│   │   ├── connection.js               # PostgreSQL pool (pg)
│   │   ├── schema.sql                  # 6 tables, 24 indexes
│   │   ├── seed.js                     # Programmatic data seeder (400+ rows)
│   │   └── setup.js                    # Schema + seed runner
│   ├── mcp/
│   │   ├── registry.js                 # MCP Tool Registry (singleton)
│   │   ├── db.js                       # Standardized DB query layer
│   │   └── tools/
│   │       ├── intelligent-document-processing.js
│   │       ├── clinical-data-extraction.js
│   │       ├── member-eligibility-lookup.js
│   │       ├── claims-history-retrieval.js
│   │       ├── ncd-guidelines-search.js
│   │       └── policy-criteria-matching.js
│   ├── agents/
│   │   ├── sensing-agent.js
│   │   ├── planning-agent.js
│   │   ├── orchestrator-agent.js
│   │   └── decision-agent.js
│   ├── pipeline/
│   │   └── processor.js                # Pipeline orchestration
│   ├── routes/
│   │   ├── auth.js
│   │   ├── prior-auth.js
│   │   └── mcp.js
│   ├── middleware/
│   │   └── auth.js                     # JWT auth middleware
│   └── documents/
│       ├── generate-pdfs.js            # PDFKit generator (15 docs)
│       └── *.pdf                       # Generated clinical PDFs
│
├── guidelines/
│   └── Guidelines.md                   # Clinical guidelines reference
├── README.md
├── API_INTEGRATION.md
├── ATTRIBUTIONS.md
└── RESEARCH.md
```

---

## 9. Data Flow: Processing a PA Request

```
User clicks "Process Request" (PA-2026-0400: Christopher Clark, CPAP Machine)
    │
    ▼
POST /api/v1/requests/PA-2026-0400/process
    │
    ▼
Pipeline Processor starts
    │
    ├─ Step 1: Sensing Agent
    │   └─ Priority: high, Doc type: sleep_study, Complexity: 7
    │
    ├─ Step 2: Planning Agent
    │   └─ Strategy: sequential-with-parallel, Tools: all 6
    │
    ├─ Step 3: Orchestrator Agent
    │   │
    │   ├─ Phase 1: IDP Tool
    │   │   └─ Extracts: patient info, diagnoses (G47.33), procedure (E0601), meds, vitals
    │   │
    │   ├─ Phase 2: Clinical Data Extraction
    │   │   └─ Validates CPT E0601, ICD-10 G47.33, extracts structured entities
    │   │
    │   ├─ Phase 3 (PARALLEL):
    │   │   ├─ Member Eligibility → Active, Gold Plus HMO, deductible 40% met
    │   │   └─ Claims History → 5 prior claims, $4,200 total, 0 denials
    │   │
    │   ├─ Phase 4: NCD Guidelines Search
    │   │   └─ Matches LCD-090 (CPAP/BiPAP Therapy), 11 criteria
    │   │
    │   └─ Phase 5: Policy Criteria Matching
    │       └─ 11/11 criteria met, recommendation: APPROVE
    │
    ├─ Step 4: Decision Agent
    │   └─ Final: APPROVED — all medical necessity criteria met per LCD-090
    │
    └─ Status updated: approved, rationale persisted
```

---

## 10. Setup & Running

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- npm

### Initial Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server && npm install

# 3. Create database
createdb prior_auth_db

# 4. Run schema + seed
node server/db/setup.js

# 5. Start backend (port 3001)
node server/index.js

# 6. Start frontend (port 5173) — in a new terminal
npm run dev
```

### Environment
- Frontend reads `VITE_API_BASE_URL` from `.env.local` (default: `http://localhost:3001/api/v1`)
- Backend connects to PostgreSQL using `pg` defaults (localhost:5432, current OS user, database: prior_auth_db)

### Verification

```bash
# Health check
curl http://localhost:3001/api/v1/health

# List MCP tools
curl http://localhost:3001/api/v1/mcp/tools

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# List requests
curl http://localhost:3001/api/v1/requests

# Process a request
curl -X POST http://localhost:3001/api/v1/requests/PA-2026-0400/process
```

### Database Reset

```bash
node server/db/setup.js --reset
```

---

## 11. Seed Data Summary

| Table | Rows | Notes |
|-------|------|-------|
| members | 15 | Varied demographics, plan types, benefit levels |
| claims | ~75 | 3-8 per member, generated programmatically |
| coverage_policies | 15 | One per procedure type, detailed JSONB criteria |
| prior_auth_requests | 15 | PA-2026-0398 through PA-2026-0412 |
| workflow_steps | ~108 | Pre-populated for completed/processing requests |
| trace_logs | ~192 | Pre-populated for completed/processing requests |
| **Total** | **~420** | |

---

## 12. Design Decisions & Trade-offs

1. **JavaScript seed data instead of SQL**: Large SQL INSERT files exceeded token limits and were hard to maintain. JavaScript programmatic generation with loops and arrays proved far more manageable.

2. **JSONB for policy criteria**: Coverage policies have highly variable structures (some have age restrictions, some have frequency limits, some require conservative treatment). JSONB provides the necessary flexibility without schema changes.

3. **TEXT[] arrays with GIN indexes**: Procedure codes and diagnosis codes are naturally multi-valued. PostgreSQL arrays with GIN indexes allow efficient overlap queries (`&&`) without a junction table.

4. **Simulated AI/ML**: The agents use rule-based logic rather than actual LLM calls. This keeps the prototype self-contained, deterministic, and runnable without API keys. The architecture is designed so that rule-based logic can be swapped for real LLM calls.

5. **Polling over WebSockets**: The frontend polls every 2 seconds during processing. For a demo/prototype, this is simpler than WebSocket infrastructure while still providing near-real-time updates. Silent polling (no loading spinner) prevents UI flicker.

6. **MCP Tool Registry pattern**: Even though tools are called locally, the registry pattern (register, list, call with schema validation) mirrors the MCP specification, making it straightforward to refactor into a true MCP server.

7. **Dashboard navigates by requestId (PA-2026-XXXX), not numeric id**: The human-readable request ID is used in URLs and routing, making the app more user-friendly and debuggable.
