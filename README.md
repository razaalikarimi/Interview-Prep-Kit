# The AI Interview Prep Kit

A production-grade, full-stack AI system that researches target companies, analyzes job descriptions, extracts role requirements, generates tailored interview questions and flashcards, and synthesizes balanced study schedules — with guaranteed deterministic coverage, stateful regeneration preservation, and active weakness radar tracking.

---

## Table of Contents
1. [System Overview & Architecture](#system-overview--architecture)
2. [Technology Stack](#technology-stack)
3. [Setup & Installation](#setup--installation)
4. [Environment Configuration](#environment-configuration)
5. [Crawler & Research Pipeline](#crawler--research-pipeline)
6. [LLM Multi-Stage Pipeline](#llm-multi-stage-pipeline)
7. [Deterministic Domain Algorithms](#deterministic-domain-algorithms)
   - [Coverage Loop & Gap Generation](#coverage-loop--gap-generation)
   - [Schedule Allocation](#schedule-allocation)
   - [Regeneration & Entity Preservation](#regeneration--entity-preservation)
   - [Weakness Radar & Spaced Repetition](#weakness-radar--spaced-repetition)
8. [Security & Hardening](#security--hardening)
   - [SSRF Defense In Depth](#ssrf-defense-in-depth)
   - [Prompt Injection Boundary Quarantine](#prompt-injection-boundary-quarantine)
   - [Authentication & Cross-User Authorization](#authentication--cross-user-authorization)
9. [Batch Evaluator CLI](#batch-evaluator-cli)
10. [Test Suites & Quality Verification](#test-suites--quality-verification)
11. [Design Trade-offs & Limitations](#design-trade-offs--limitations)

---

## 1. System Overview & Architecture

Monorepo architecture structured as clean npm workspaces:
- `packages/shared`: Shared Zod schemas, TypeScript contracts, error codes, and system constants.
- `apps/api`: Express.js REST API with rate-limiting, MongoDB Atlas persistence, safe crawling engine, and LLM orchestration.
- `apps/web`: Next.js 16 (Turbopack, App Router) frontend with Tailwind CSS dark-mode UI, inline editing, and live polling.
- `scripts/evaluate.ts`: Production Batch Evaluator CLI running the exact same service layer as the web application.

```
├── packages/
│   └── shared/               # Universal data contracts, Zod schemas, error codes
├── apps/
│   ├── api/                  # Express REST API, Crawler, Pipeline Orchestrator, Mongoose Models
│   └── web/                  # Next.js 16 (App Router), Tailwind CSS UI
├── scripts/
│   └── evaluate.ts           # Batch Evaluator CLI
├── seed/
│   └── cases.json            # Batch test cases
└── tests/                    # Vitest unit, domain, and security test suites
```

---

## 2. Technology Stack

- **Runtime**: Node.js v20+ / v24, TypeScript 5.5+ (Strict mode, `exactOptionalPropertyTypes: true`)
- **Backend**: Express.js, Mongoose 8 (MongoDB Atlas), Cheerio, Robots-Parser, Winston logger
- **Frontend**: Next.js 16.3, React 19, Tailwind CSS v4, Lucide Icons
- **AI / LLMs**: OpenAI (`gpt-4o`, `gpt-4o-mini`) and Google Gemini (`gemini-1.5-flash`, `gemini-1.5-pro`) with structured JSON mode and exponential backoff
- **Testing**: Vitest 2.1 (Domain algorithms, SSRF, schema contracts, regeneration)
- **Monorepo**: NPM Workspaces

---

## 3. Setup & Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB instance (local or MongoDB Atlas)
- OpenAI or Gemini API Key

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd "The AI Interview Prep Kit"

# Install all workspace dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Running Locally
```bash
# Seed default credentials (demo@example.com / Demo123!@#)
npm run seed

# Run backend API server (starts on port 3001)
npm run dev:api

# Run web frontend (starts on port 3000)
npm run dev:web

# Or run both concurrently
npm run dev
```

---

## 4. Environment Configuration

All settings are configured via `.env` at the root (and shared with workspaces):

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/interview-prep` |
| `JWT_SECRET` | Secret key for signing JWT cookies | Min 32 chars |
| `LLM_PROVIDER` | LLM service provider (`openai` or `gemini`) | `openai` |
| `LLM_MODEL` | Target model name | `gpt-4o-mini` |
| `LLM_API_KEY` | Primary LLM API key (`sk-...` or Gemini key) | Required |
| `CRAWLER_MAX_PAGES` | Max crawled pages per target company | `15` |
| `CRAWLER_TIMEOUT_MS` | Per-page request timeout | `10000` (10s) |
| `SSRF_ALLOW_HOSTS` | Comma-separated allowed test hosts (Evaluation only) | `localhost,127.0.0.1` |
| `EVAL_MODE` | Enable evaluator mode for localhost testing | `false` |

---

## 5. Crawler & Research Pipeline

The crawler performs signal-based link discovery and scraping without hardcoded page lists:
1. **SSRF Guard**: Pre-flight DNS resolution blocks internal networks, cloud metadata (`169.254.169.254`), and dangerous protocols.
2. **Robots.txt Adherence**: Respects `robots.txt` disallow directives and crawl delays.
3. **HTML Sanitization**: Uses Cheerio to strip scripts, styles, navigations, footers, SVGs, and extract pure content text.
4. **Dynamic Link Ranking**: Discovers and ranks internal links scoring them for careers, hiring, engineering blogs, and company culture signals.
5. **Interview Insights Researcher**: Separate research step targeting public interview discussions and question formats.

---

## 6. LLM Multi-Stage Pipeline

Instead of a single monolithic prompt, the system executes 12 decoupled stages:
1. `validating`: Input schema verification and SSRF pre-flight validation.
2. `extracting_requirements`: Extracts technical, behavioural, and domain requirements with strict `must` vs `nice` classification and stable IDs (`r1`, `r2`, ...).
3. `researching_company`: Discovers and scrapes high-signal company pages.
4. `finding_hiring_process`: Extracts hiring stages and interview rubrics from discovered pages.
5. `researching_public_interviews`: Analyzes public candidate discussions without fabrication.
6. `generating_questions`: Generates questions across four mandatory categories:
   - `technical`
   - `behavioural`
   - `system-design`
   - `company-fit`
7. `generating_flashcards`: Synthesizes concise front/back study cards linked to requirement IDs.
8. `checking_coverage`: Pure deterministic cross-referencing of requirements vs question requirement IDs.
9. `closing_coverage_gaps`: Target LLM generation specifically targeting any uncovered requirements (capped at 3 passes).
10. `allocating_schedule`: Deterministic daily study plan allocation (20–180 min/day).
11. `validating_kit`: Structural integrity validation against foreign IDs.
12. `saving`: Atomic database write with SHA-256 fingerprint deduplication.

---

## 7. Deterministic Domain Algorithms

### Coverage Loop & Gap Generation
- **Pure Function**: `checkCoverage(requirements, questions, passNumber)` executes zero LLM logic.
- Returns list of `uncovered_requirement_ids`.
- If gaps exist, triggers targeted generation only for the missing IDs and re-evaluates (bounded by `MAX_COVERAGE_PASSES = 3`).

### Schedule Allocation
- **Pure Function**: `allocateSchedule(requirements, questions, days)` distributes workload across 1–60 days.
- Prioritizes must-have requirements in early days.
- Enforces strict minimum (20 mins) and maximum (180 mins) study time per day.
- Exactly matches `days_available === days.length`.

### Regeneration & Entity Preservation
- Preserves user trust: questions and flashcards with `state.edited = true` or `state.pinned = true` are **never** overwritten or removed during section regeneration.
- Regenerates only unedited, unpinned items in the requested section.
- Optimistic concurrency control using incrementing document `version` fields.

### Weakness Radar & Spaced Repetition
- **Pure Math**: `computeWeaknessRadar(...)` combines user practice confidence (1–5 scale), requirement priority (`must=2`, `nice=1`), question coverage, and recency decay.
- Automatically orders flashcards for practice sessions in **weak-first priority**.

---

## 8. Security & Hardening

### SSRF Defense In Depth
- Pre-flight DNS resolution converts target hostnames to IP addresses before initiating requests.
- Blocks:
  - IPv4 loopback (`127.0.0.0/8`) and IPv6 loopback (`::1`)
  - RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
  - Cloud provider metadata IP (`169.254.169.254`)
  - Link-local and multicast ranges
- Inspects every HTTP redirect hop against the SSRF validator.
- Localhost testing is strictly gated: only allowed when both `EVAL_MODE=true` and explicit hosts are enumerated in `SSRF_ALLOW_HOSTS`.

### Prompt Injection Boundary Quarantine
- External crawled text and job descriptions are quarantined inside strict XML boundaries:
  `<UNTRUSTED_EXTERNAL_CONTENT source="...">`
- System instructions strictly mandate that LLMs treat all enclosed text as untrusted data and ignore any embedded directives.

### Authentication & Cross-User Authorization
- Passwords hashed with `bcryptjs` (salt rounds: 12). Password hashes are excluded from all JSON serialization.
- JWT stored in `httpOnly`, `SameSite=lax` secure cookies.
- All Kit operations (`GET`, `PATCH`, `DELETE`, `regenerate`) verify document ownership against authenticated JWT session identity.

---

## 9. Batch Evaluator CLI

Run automated batch evaluation on JSON test cases:
```bash
npm run evaluate -- --input seed/cases.json --output seed/output.json
```

- Executes the **exact same service pipeline** as the web application.
- Continues execution after individual failures, outputting conforming `BatchOutput` JSON:
```json
{
  "version": "1.0",
  "generated_at": "2026-09-12T09:18:00.000Z",
  "kits": [
    { "id": "case-01", "status": "ok", "kit": { ... }, "error": null },
    { "id": "case-02", "status": "failed", "kit": null, "error": { "code": "COMPANY_UNREACHABLE", "message": "..." } }
  ]
}
```

---

## 10. Test Suites & Quality Verification

Run all test suites and verification scripts:
```bash
# Run unit & security tests (Vitest)
npm test

# Run strict TypeScript typechecking
npm run typecheck

# Run ESLint across all workspaces
npm run lint

# Compile production bundles
npm run build
```

---

## 11. Design Trade-offs & Limitations

1. **Deterministic vs LLM-generated schedules**:
   - *Decision*: Schedule allocation is strictly algorithmic rather than LLM-generated.
   - *Rationale*: Guarantees exact day counts, balanced daily minutes, and zero missing requirements.
2. **Crawl Concurrency vs Rate Limits**:
   - *Decision*: Concurrency capped at 2 requests with 500ms delay.
   - *Rationale*: Prevents IP bans and server degradation on target company websites.
3. **In-Memory Job State vs Message Queue**:
   - *Decision*: Pipeline tasks are tracked directly in MongoDB with asynchronous worker execution.
   - *Rationale*: Eliminates external Redis dependency for assessment portability while providing atomic progress polling.
