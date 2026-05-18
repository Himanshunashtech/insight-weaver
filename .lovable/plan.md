## What we're building

A Sola.ai clone with two halves:

1. **Marketing site** — public pages that visually mirror sola.ai's structure, colors, and section order
2. **Authenticated product** (`/app/*`) — a real working RPA-style automation platform, scoped to web/API actions (no desktop control or computer vision — those are not possible in a web runtime)

Built on the existing TanStack Start template with Lovable Cloud (auth, Postgres, storage) and Lovable AI Gateway for AI features.

---

## Phase 1 — Foundations

- Enable Lovable Cloud (auth + database + storage)
- Provision Lovable AI Gateway key
- Install: `reactflow` (visual editor canvas), `recharts` (monitoring charts), `zod`, `react-hook-form`, `framer-motion`, `react-markdown`, `date-fns`
- Set up design system in `src/styles.css`:
  - Sola's color palette: deep navy `#0A1633`, off-white `#F5F2EB`, accent gradient orange→pink, muted grays
  - Typography: Inter for body, a tighter display font for headings
  - Tokens for gradients, shadows, radii
- Root layout with shared marketing header/footer; separate app shell for authenticated routes

---

## Phase 2 — Marketing site (pixel-close clone)

Routes (each a separate file with its own SEO `head()`):

- `/` — Home: Series A banner, hero, logo wall, "Why Sola" 4-feature grid, testimonials carousel, capabilities tabs with screenshots, industries grid, CTA
- `/product` — Full product feature breakdown (RPA, Document Processing, Orchestration, Data Transformation)
- `/industries` — index, plus `/industries/$slug` (bfsi, healthcare, logistics, legal, manufacturing, real-estate)
- `/solutions` — use-case tabs
- `/pricing` — tiers (Starter / Pro / Enterprise — "contact us")
- `/about`, `/customers`, `/contact`, `/series-a-announcement`
- Animated sections (scroll reveal via framer-motion), generated illustrations matching Sola's style

---

## Phase 3 — Auth & workspace model

- Email/password + Google sign-in (via Lovable broker + `supabase--configure_social_auth`)
- `/login`, `/signup`, `/reset-password`
- `_authenticated` layout route guarding all `/app/*` pages
- Database: `profiles`, `workspaces`, `workspace_members`, separate `user_roles` (admin / builder / viewer), `has_role()` SECURITY DEFINER function
- RLS on every table scoped to workspace membership
- Workspace switcher in app header

---

## Phase 4 — App shell & dashboard

- `/app` — Dashboard: KPI cards (runs today, success rate, active workflows, time saved), recent activity feed, run trend chart (recharts)
- Sidebar nav: Dashboard, Workflows, Runs, Documents, Integrations, API & Webhooks, Team, Settings
- Top bar: workspace switcher, search, notifications, user menu

---

## Phase 5 — Workflow library & visual editor

- `/app/workflows` — list/grid view, search, tag filter, status (draft / active / paused), bulk actions
- `/app/workflows/new` and `/app/workflows/$id` — visual editor using React Flow
- Node types: **Trigger** (manual / webhook / schedule), **HTTP Request**, **Condition (if/else)**, **Loop**, **Data Transform**, **AI Step** (LLM call), **Document Extract**, **Delay**, **Webhook Out**, **Log**
- Right-side panel for editing selected node's config (zod-validated forms)
- Top bar: name, save, test run, activate, version history
- Graph stored as JSON in `workflows.graph` column

---

## Phase 6 — AI workflow generation

- "Generate from description" button in workflow editor
- Modal: user describes a process in plain English
- Server function streams Lovable AI (Gemini 3 Flash) with a structured-output schema that returns a valid node/edge graph
- Result is loaded onto the canvas for the user to refine
- This is the closest realistic equivalent of Sola's "record → bot" feature

---

## Phase 7 — Run engine (web/API only)

- `runWorkflow` server function executes a saved graph node-by-node
- Each node has a typed executor (HTTP, condition, loop, transform via JSONPath, AI call, document extract, delay)
- Persists `runs` (id, workflow_id, status, started_at, finished_at, trigger) and `run_steps` (node_id, status, input, output, error, duration)
- Triggers:
  - Manual ("Test run" / "Run now" button)
  - Webhook: each workflow gets `POST /api/public/webhook/$workflowId` with HMAC signature verification
  - Scheduled: stored as cron expression; pg_cron calls a public endpoint that enqueues runs

---

## Phase 8 — Document processing

- `/app/documents` — upload PDF / image to Cloud storage
- Server function uses Lovable AI multimodal (Gemini 2.5 Pro) with structured output to extract fields per a user-defined schema
- Reusable as a node inside workflows (`Document Extract` node references a schema)

---

## Phase 9 — Monitoring & observability

- `/app/runs` — table of runs (workflow, status, duration, trigger, started)
- `/app/runs/$id` — step-by-step execution view: node graph with each node colored by status, expandable input/output JSON per step, error stack traces
- Charts: success rate over time, runs per workflow, avg duration
- Audit log (`audit_events`) for workflow create/edit/activate/delete

---

## Phase 10 — Integrations, API & team

- `/app/integrations` — catalog UI (Slack, Gmail, Sheets, HTTP, Webhook, OpenAI, etc.). Wire the ones with Lovable connectors; mark others as "Coming soon"
- `/app/api` — workspace API keys (create, revoke, copy), webhook URLs per workflow, docs snippets
- `/app/team` — invite by email, role management, remove members
- `/app/settings` — profile, workspace name/logo, billing placeholder

---

## Technical details

**Stack**: TanStack Start v1 (existing template), React 19, Tailwind v4, Lovable Cloud (Supabase), Lovable AI Gateway, React Flow, Recharts, Framer Motion.

**Server boundary**: All DB and AI calls in `createServerFn` handlers under `src/lib/*.functions.ts`. `requireSupabaseAuth` middleware for user-scoped reads/writes. `supabaseAdmin` only for run engine internals (it bypasses RLS to coordinate cross-user webhook triggers, gated by HMAC).

**Database (high level)**:
```
profiles, workspaces, workspace_members, user_roles
workflows (graph jsonb, status, trigger_type, schedule)
runs, run_steps
documents, document_schemas
integrations (workspace, type, encrypted config)
api_keys, audit_events
```
RLS scoped via `is_workspace_member(workspace_id, auth.uid())` SECURITY DEFINER helper.

**Public routes**: `/api/public/webhook/$workflowId` (HMAC-verified inbound triggers) and `/api/public/cron/run-schedules` (called by pg_cron).

**Worker runtime caveats**: No `child_process`, no native binaries, no long-running processes. The run engine executes synchronously per request; very long workflows are capped (Sola's enterprise execution model isn't reproducible here — flagged earlier).

---

## Out of scope (will NOT be built — covered in earlier message)

- Desktop / browser RPA execution (would need native agent)
- Chrome recorder extension
- Computer-vision element detection
- SAML SSO, SOC2 compliance tooling
- Long-running scheduled bots that act on customer infra

---

## Delivery order

I'll ship in this order, pausing after each so you can review:

1. Foundations + design system + marketing home + product page
2. Remaining marketing pages (industries, solutions, pricing, about, contact)
3. Auth + workspaces + app shell + dashboard
4. Workflow library + visual editor (no execution yet)
5. Run engine + manual/webhook triggers + monitoring
6. AI workflow generation + document processing
7. Integrations + API keys + team + settings + scheduling polish

This is a multi-iteration build — expect roughly 7 substantial implementation passes.