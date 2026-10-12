# DoRoboty.ai — flows and functionality register

This is the register of **current application behavior**, not a roadmap or a promise
that a feature has been deployed. It covers the AIPH3 case application in this repository,
not the separate public production portal. Last source review: 2026-10-11.

Read [BRIEF.md](BRIEF.md) for intent, [TODO.md](TODO.md) for outstanding work, and
[CASE_PROTOCOL.md](docs/case/CASE_PROTOCOL.md) for the teaching contract. When these
disagree with the implementation, record the gap here instead of treating a planned
feature as implemented.

## Maintenance contract

- Update this register in the same change as any new, changed, removed, or hidden flow,
  route, permission, feature gate, integration, or user-visible behavior.
- Keep stable IDs. Update affected entries; do not silently reuse an ID for another feature.
- Each entry must identify the audience, entry point, behavior/result, conditions, and
  important data or access boundaries. Add implementation and test evidence when relevant.
- Record known limitations and intentional exceptions. An existing backend is not evidence
  that a feature is available in the UI.
- Distinguish source implementation, automated coverage, actual test execution, and
  deployment verification. Never infer one from another.
- If a feature is removed, retain its ID with a removal note until historical references
  are no longer needed. Keep future work in TODO, linked from the relevant entry.

Status vocabulary:

| Status      | Meaning                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------- |
| Available   | Implemented and exposed in the current UI; live workspaces require configured Supabase.     |
| Conditional | Implemented, but depends on a role, configuration, release stage, or experiment assignment. |
| Hidden      | Implementation/data exist, but the current UI intentionally does not expose the feature.    |
| Partial     | Part of the flow exists; the remaining boundary is stated explicitly.                       |
| Tooling     | Instructor/developer operation through a script or runbook, not a self-service UI.          |

## Audiences and operating modes

| Audience/mode   | Access and boundary                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visitor         | Public jobs, companies, methodology, privacy, and authentication entry points. No private profile, CV, brief, or application access.                                                         |
| Candidate       | Own profile, CV, drafts, saved jobs, applications, and account settings. Cannot use employer actions or grant themselves another role.                                                       |
| Employer        | Own organization and its jobs/applications. Account provisioning is separate from candidate self-registration.                                                                               |
| Operator        | Case releases and analysis, plus authorized recruiting/AI inspection. Not interchangeable with a candidate account; organization creation and manual job creation require the employer role. |
| Participant     | A course persona, not an additional database role. Uses the candidate/employer/operator identities provisioned for their fork.                                                               |
| Public fixtures | If Supabase is absent, public browsing uses deterministic fixtures. Configured Supabase failures do not fall back to fixtures.                                                               |
| Starter demo    | `/demo`, `/demo/settings`, `/components` use static demonstration data without domain persistence or service credentials.                                                                    |

Shared course data must remain synthetic. CV support is implemented, but this is not
authorization to process real production CVs in the shared teaching environment.

## Public marketplace

| ID / status        | Entry                                   | Flow and result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PUB-01 Available   | `/`                                     | Browse the DoRoboty.ai positioning, Build / Apply / Lead categories, and links into the marketplace and account entry points. Robot brand mark is shared across shells.                                                                                                                                                                                                                                                                                                                                                     |
| PUB-02 Available   | `/oferty`                               | Browse published roles, counts, company, salary and work metadata. Open a role from its title/card. Database results are ordered by newest publication; sorting is not a selectable control.                                                                                                                                                                                                                                                                                                                                |
| PUB-03 Available   | `/oferty?...`                           | Submit a native GET filter form for `query`, `category`, `function`, `remote`, `seniority`, `contract`, and `location`; URL survives reload/share. Clear filters from an empty result state. Filters and list browsing work without JavaScript.                                                                                                                                                                                                                                                                             |
| PUB-04 Available   | `/oferty?page=...`                      | Server-rendered list pages show 20 roles, total matching count and displayed range. Previous/next and compact page-number links retain validated filters and work without JavaScript; mobile shows the current/total page indicator. Filter submissions and list/map changes restart at page one. Out-of-range pages redirect to the last valid page (first for empty results); single-page sets have no navigation. Published ordering uses timestamp plus ID tie-breaker. Filters remain single-valued, not multi-select. |
| PUB-05 Conditional | `/oferty?view=map`                      | Switch list/map while retaining validated filters and clearing the list page. The map remains unpaginated, showing all matching roles. MapLibre displays markers and clickable role popups alongside a linked result list. Requires JavaScript, WebGL, a working map worker and external OpenFreeMap tiles; jobs without coordinates remain in the result list but have no marker. New manual offers do not automatically receive coordinates.                                                                              |
| PUB-06 Available   | `/oferty/[slug]`                        | Read the full role description, company, location/work mode, seniority, contract and salary; open company details. Description is displayed as plain text paragraphs, not rendered Markdown. Candidate sees apply/save actions; anonymous visitor sees sign-in/register with the target role retained; other roles are told applications require a candidate account.                                                                                                                                                       |
| PUB-07 Available   | `/firmy/[slug]`                         | Read company information and its roles. With Supabase configured, the company page is resolved from published jobs; a company with none is not independently browsable.                                                                                                                                                                                                                                                                                                                                                     |
| PUB-08 Available   | `/metodologia`                          | Read category and verification explanations. Verification is stored editorial/employer status, not a background check, guarantee of employment, or automatic validation of a role.                                                                                                                                                                                                                                                                                                                                          |
| PUB-09 Available   | `/polityka-prywatnosci`                 | Read the application privacy information. Final course privacy approval remains an external dependency in TODO.                                                                                                                                                                                                                                                                                                                                                                                                             |
| PUB-10 Available   | Shared public navigation                | Anonymous login/signup controls become account/profile/application/logout links for a candidate session; employer/operator receive their role-appropriate account entry. Company login has an explicit employer audience.                                                                                                                                                                                                                                                                                                   |
| PUB-11 Available   | Metadata, `/robots.txt`, `/sitemap.xml` | Canonicals, titles/descriptions, job JSON-LD and public sitemap. Filtered combinations are `noindex`; robots disallows `/app`, `/auth`, `/api`, `/aplikuj`. This is crawler guidance, not authorization.                                                                                                                                                                                                                                                                                                                    |
| PUB-12 Partial     | Unavailable roles and errors            | Unknown/unpublished job detail returns 404; there is no preserved expired-role landing page or daily expiry cron in this app. Submission separately rejects a past `expiry_at`. Public published-job queries do not themselves filter by expiry timestamp. Shared not-found/error boundaries handle failures.                                                                                                                                                                                                               |

Evidence: [job features](src/features/jobs/), [public routes](<src/app/(public)/>),
[public session navigation](src/features/public/public-session-nav.tsx),
[robots](src/app/robots.ts), [sitemap](src/app/sitemap.ts).
Coverage: [public browser tests](tests/e2e/public.spec.ts),
[filter tests](src/features/jobs/filters.test.ts).

Pagination evidence: [page calculations/URLs](src/features/jobs/pagination.ts),
[shared-control navigation](src/features/jobs/job-pagination.tsx),
[unit coverage](src/features/jobs/pagination.test.ts), and the expanded marketplace
scenario in [integration tests](tests/integration/auth.spec.ts). Current pagination
slices the filtered dataset on the server; it does not provide database-level paging
beyond the existing Supabase query row limit.

**PUB-13 Available — company identities.** Shared job cards (including saved jobs),
`/oferty/[slug]` and `/firmy/[slug]` display company logos. The 25 optional synthetic
marketplace companies have generated transparent local marks, resolved by their
`demo-*` slugs without database updates. Valid existing company logo URLs take
precedence; companies without artwork keep initials. Failed image loads fall back
to initials when JavaScript is available. Company names and links remain separate,
accessible server-rendered text; images are decorative. Local PNGs use Next.js
image optimization with reserved dimensions. Remote custom logos load directly,
not through an unrestricted image proxy. Map marker initials are intentionally
unchanged. There is no logo-upload/editor flow. Evidence:
[shared renderer](src/features/jobs/company-logo.tsx),
[defaults and resolution](src/features/jobs/company-logos.ts),
[unit tests](src/features/jobs/company-logos.test.ts), and
[asset prompts/review](docs/tasks/company-logos.md).

## Identity and sessions

| ID / status         | Entry                                                                | Flow and result                                                                                                                                                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-01 Available   | `/auth/sign-up?audience=candidate&next=...`                          | Candidate enters first name, last name, email, password and privacy acknowledgement. Supabase creates the account/profile; email confirmation is used when configured. Confirmed candidate continues through onboarding toward the retained destination. Password validation requires at least eight characters.                |
| AUTH-02 Available   | `/auth/sign-in?audience=candidate`                                   | Candidate signs in with email/password, then follows the safe `next` destination. Current matching session can continue without signing in again.                                                                                                                                                                               |
| AUTH-03 Available   | `/auth/sign-in?audience=employer&next=/app/oferty`                   | Employer/operator entry uses the existing provisioned account. Employer-scoped signup does not create a candidate and redirects to employer sign-in. There is no public employer-registration flow.                                                                                                                             |
| AUTH-04 Available   | Audience-scoped login or protected route                             | Wrong account type gets a clear mismatch explanation, own-account link and explicit switch-account action. Switching signs out the local session, clears credentials, and retains the intended audience/destination; it does not change the stored role. Credentials must succeed before an account-type mismatch is disclosed. |
| AUTH-05 Available   | `/auth/forgot-password` → `/auth/callback` → `/auth/update-password` | Request recovery email, follow the authorized callback, set a new password, and retain audience/return context. Invalid confirmation links show an error. Callback and `next` validation reject external destinations and auth-loop destinations.                                                                               |
| AUTH-06 Available   | Public/workspace logout and protected routes                         | Session cookies are refreshed through the proxy; signed-out visitors to `/app/*` or `/aplikuj/*` are sent to the appropriate sign-in with return path. Server guards and RLS enforce roles independently of navigation/layouts.                                                                                                 |
| AUTH-07 Conditional | Auth and workspace with missing configuration                        | Show configuration guidance rather than a simulated authenticated session. Public fixtures/demo do not provide real login.                                                                                                                                                                                                      |

Evidence: [auth features](src/features/auth/), [auth routes](src/app/auth/),
[proxy](src/proxy.ts). Coverage: audience/return-path unit tests and
[auth integration tests](tests/integration/auth.spec.ts) for signup, recovery,
independent sessions, wrong-role access and switching in both directions.

## Candidate workspace

| ID / status        | Entry                                      | Flow and result                                                                                                                                                                                                                                                                                                                               |
| ------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAN-01 Available   | `/app` as candidate                        | See personalized home, profile readiness, recent application statuses, saved-job count and resumable application drafts. Empty accounts get first-step guidance rather than seeded content.                                                                                                                                                   |
| CAN-02 Available   | `/app/onboarding?next=...`                 | Complete identity/basic profile, source experience and CV-readiness steps; retain the role that prompted registration and continue toward applying. Readiness is guidance, not evidence that every listed field is a submission requirement.                                                                                                  |
| CAN-03 Available   | `/app/profil`                              | Edit name, headline, biography, city, experience years and language context; save structured profile. Optional preferences cover role/category, seniority, locations, work mode, contract and salary. Preferences remain private and are not included in the employer submission snapshot.                                                    |
| CAN-04 Available   | Experience section on `/app/profil`        | Add source experience with role/company, description and measurable outcome; remove/reorder entries. Select relevant entries later when preparing an application.                                                                                                                                                                             |
| CAN-05 Hidden      | Work-sample extension points               | `candidateWorkSamplesEnabled = false` hides sample editing, preview and new-application selection. Existing records/backend support and historical submitted snapshots are preserved. Hidden does not mean the stored data was deleted or every backend operation disabled.                                                                   |
| CAN-06 Available   | CV section on `/app/profil`                | Upload a PDF up to 5 MB, inspect filename/metadata, open via temporary signed URL, replace or remove current CV. Files live in private Storage. Submitted CV versions are retained, so replacing/removing the current CV does not rewrite a past application.                                                                                 |
| CAN-07 Available   | `/app/profil/podglad`                      | Inspect a current-profile preview, source experience and CV context. This is not the immutable content already sent in an application; past submissions are inspected separately.                                                                                                                                                             |
| CAN-08 Available   | Save action → `/app/zapisane`              | Save/unsave a role and revisit it privately. Unavailable saved roles are handled without granting access to hidden offers.                                                                                                                                                                                                                    |
| CAN-09 Available   | `/aplikuj/[slug]`                          | Read the target role's full description/expectations and metadata alongside the editor. Select source experience, write the answer, review profile/evidence/CV/role context, explicitly confirm and submit. Validation prevents unavailable/expired roles, incomplete source/profile and unauthorized evidence.                               |
| CAN-10 Available   | Application editor → dashboard resume link | Autosave a private per-role draft with answer, selected sources, AI reference and current step; reload/resume or explicitly discard it. A draft is not a submitted application and is not visible to an employer.                                                                                                                             |
| CAN-11 Conditional | Application variant                        | Stable case assignment chooses long-form or one-click. One-click uses a ready saved profile/source context; review and explicit confirmation still apply. It is not unrestricted anonymous application submission.                                                                                                                            |
| CAN-12 Conditional | AI controls in application editor          | Generate a role-specific draft from candidate profile, role and selected source evidence; review/edit/regenerate/discard it and explicitly approve by submission. Availability depends on case release/assignment and provider mode. Manual writing remains possible; no automatic application or invented-achievement guarantee is implied.  |
| CAN-13 Available   | Submit → `/app/aplikacje/[id]/wyslano`     | Receive confirmation and links to the submitted record/history. Submission is atomic/idempotent and one application per candidate/role is enforced. Role/profile/source/answer/CV snapshots preserve what was sent even after later edits.                                                                                                    |
| CAN-14 Available   | `/app/aplikacje`                           | Browse own applications with Polish status labels and status filters; open a record.                                                                                                                                                                                                                                                          |
| CAN-15 Available   | `/app/aplikacje/[id]`                      | Inspect exact submitted content, role/profile/evidence/CV snapshot and candidate-safe stage timeline. Employer internal notes and fit scores are not part of this view.                                                                                                                                                                       |
| CAN-16 Available   | Withdraw action in application details     | Explicitly confirm withdrawal at allowed nonterminal stages. Status/timeline update; sent history remains available. Rejected, withdrawn and hired applications cannot be treated as active processes.                                                                                                                                        |
| CAN-17 Available   | `/app/settings`                            | Change email with current-password verification and any required Supabase confirmation; password change links to the email recovery flow. Choose light/dark/system appearance. Export own account/profile/evidence/document metadata/applications/history/saved jobs/drafts as JSON via `/api/account/export`; this is not a ZIP of CV bytes. |
| CAN-18 Partial     | Account deletion request in settings       | Create/cancel a pending deletion request. Actual operator fulfillment and complete deletion runbook are not yet closed; the button does not immediately delete the account or guarantee an automated deletion date. See M11-07 in TODO.                                                                                                       |

Evidence: [candidate features](src/features/candidates/),
[application features](src/features/applications/),
[candidate routes](src/app/app/), [application entry](<src/app/(public)/aplikuj/>),
[account export](src/app/api/account/export/route.ts).
Coverage: candidate/CV/application schema unit tests and
[integration journeys](tests/integration/auth.spec.ts), including a new candidate,
draft resume, immutable CV access, withdrawal, RLS and responsive/light-dark checks.

Candidate process states are `submitted`, `in_review`, `interview`, `continued`,
`rejected`, `withdrawn`, `hired`. Timeline events further distinguish an invitation
from a completed first conversation. UI copy is mapped in
[application presentation](src/features/applications/presentation.ts).

## Employer workspace and recruiting

| ID / status        | Entry                                | Flow and result                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| EMP-01 Conditional | Provisioned account → `/app`         | Open the employer dashboard and links to candidates, role outcomes and marketplace. A candidate session cannot silently become an employer session.                                                                                                                                  |
| EMP-02 Available   | `/app/organizacja` as employer       | Existing membership shows organization identity. Without a membership, validated onboarding creates company, organization and owner membership. Organization/team editing and member invitation are not implemented here.                                                            |
| EMP-03 Available   | `/app/oferty` manual form            | Create a role with slug/title/summary/description, taxonomy, location, salary/expiry and optional private brief/decision criteria. Creation is scoped to the employer organization and enters review, not instant publication. Validation reports duplicate slug and invalid values. |
| EMP-04 Available   | Own role list → `/app/oferty/[id]`   | Click through Polish publication status to full role/settings/private brief; open its candidates via `?job=<id>` and public detail if published. This detail page is not a general role editor, publish switch or delete/archive screen.                                             |
| EMP-05 Available   | `/app/oferty#brief-source`           | Choose an owned role and create/update its private source brief and decision criteria. These inputs are separate from public copy and readable only within authorized scope.                                                                                                         |
| EMP-06 Conditional | Job draft workspace on `/app/oferty` | Generate copy from the source brief, inspect/edit it and explicitly approve. Preserve source/generated/final versions and generation provenance. Gated by employer AI assignment/release; operator has an authorized bypass. Not a complete self-service publishing lifecycle.       |
| EMP-07 Available   | `/app/kandydaci?job=<id>`            | Browse applications for the organization, filter per role, inspect Polish status and source context, open a candidate record. Optional notes and stage actions show success/error feedback.                                                                                          |
| EMP-08 Available   | `/app/kandydaci/[id]`                | Inspect submitted candidate/profile/evidence/answer/role context and historical CV using authorized signed access. Candidate CV is inaccessible before an application to the employer's organization; another organization's submissions remain private.                             |
| EMP-09 Available   | Recruiting actions                   | Record review, interview invitation, completed first conversation, continuation, rejection or hiring. Store stage history, private notes and downstream outcomes. The action records a decision; it does not send an invitation, book a meeting or contact the candidate.            |
| EMP-10 Available   | `/app/settings` as employer/operator | Change browser appearance and read operational-data/privacy information. Candidate-specific export/deletion/email/password controls are not exposed in this role's settings panel.                                                                                                   |

Evidence: [organization features](src/features/organizations/),
[manual job creation](src/features/jobs/employer-job-actions.ts),
[AI features](src/features/ai/), [employer routes](src/app/app/kandydaci/),
[stage actions](src/features/applications/actions.ts).
Coverage: employer schema tests and integration tests for organization creation,
review-role creation, private briefs, candidate/CV access and recruiting outcomes.

## Case operations, experiments and AI infrastructure

| ID / status        | Entry                                                            | Flow and result                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OPS-01 Available   | `/app/case` as operator                                          | Inspect deterministic release data, funnel/outcome metrics and cohort comparisons. Select `baseline`, `post_one_click`, `discovery`, `post_ai`, `pilot`, `demo_day`; preview selection and active released stage are distinct. Instructor can inspect future stages; participants must not receive them early.                                                                   |
| OPS-02 Available   | Release control on `/app/case`                                   | Persist active case release through an operator-authorized action; later assignments/exposures are constrained by release. Candidate/employer cannot operate this switch.                                                                                                                                                                                                        |
| OPS-03 Available   | `/app/case?...`                                                  | Segment fixture analysis by `jobFamily`, `seniority`, `employerReadiness`, `languageBackground`; inspect validation results. Metrics on this screen are generated case fixtures, not a live production analytics dashboard.                                                                                                                                                      |
| OPS-04 Available   | `/app/case/pilot`                                                | Change URL-based cost/value assumptions and calculate incremental continuations, value, cost, net value and break-even. This is a scenario calculator, not a persisted pilot plan or proof of causality.                                                                                                                                                                         |
| OPS-05 Conditional | Experiment assignment/exposure                                   | Stable assignments independently control application form, candidate AI and employer AI surfaces. Exposure is recorded separately and idempotently; future treatment is blocked until release.                                                                                                                                                                                   |
| OPS-06 Conditional | AI generation service                                            | Default provider is deterministic `course-fixture-v1`. `AI_PROVIDER=openai-compatible` with server-side key/model/base URL enables a real provider; configuration/provider errors do not authorize publication/submission. Timeout, quota, output validation and estimated per-request cost limits apply; deployment-wide budget enforcement is not established by these guards. |
| OPS-07 Available   | AI/applications data                                             | Keep generation metadata and source/generated/final versions separate. Compute text-fit as a limited similarity proxy, not a recommendation, ranking guarantee or automated hiring decision. Humans approve copy and make recruiting decisions.                                                                                                                                  |
| OPS-08 Tooling     | `npm run case:validate`, `case:red-team`, `case:export`          | Validate deterministic datasets, inspect red-team invariants and export staged case CSV evidence. Script output is not a substitute for the independent human red-team gate still open in TODO.                                                                                                                                                                                  |
| OPS-09 Tooling     | `npm run case:packet`, `case:verify-packet`, `case:final-export` | Build/verify staged participant packets and final evidence exports. Follow anti-spoiler and joining/provenance rules in the case runbooks.                                                                                                                                                                                                                                       |
| OPS-10 Tooling     | `db:setup`, `case:accounts`, `case:rehearsal-accounts`           | Prepare local database/fixtures and scoped testing or rehearsal identities. Local setup resets local data; it must not run against a cloud database or overwrite a user's active test data casually.                                                                                                                                                                             |
| OPS-11 Tooling     | Participant/deployment/pilot runbooks                            | Support fork/configure/deploy, authenticated smoke testing, instructor rehearsal, real-person test, 30-day pilot and Demo Day. Human testing, cohort release approval and external service verification remain separate deliverables.                                                                                                                                            |

Evidence: [case features](src/features/case-data/),
[experiments](src/features/experiments/), [AI provider](src/features/ai/provider.ts),
[case scripts](scripts/case/), [case runbooks](docs/case/),
[participant guide](docs/PARTICIPANT_GUIDE.md), [deployment](docs/deployment.md).
Coverage: generator/packet/business-case/AI/text-fit unit tests and integration tests
for operator access, release gating, assignment stability and AI approval/provenance.

## Shared platform and starter demonstration

**SYS-07 Tooling — optional local marketplace volume.** `npm run db:seed-marketplace`
adds 100 synthetic published roles across 25 fictional companies to the running local
Supabase stack, without reset or changed memberships. Roles have map coordinates,
organizations, private briefs, salary/dates and public text versions. Reruns preserve
existing records and edits. This is separate from canonical course releases and the
static demo; existing employer accounts do not gain access to these organizations.
Evidence: [supplement SQL](supabase/marketplace-fixtures.sql),
[local-only runner](scripts/seed-marketplace.mjs),
[schema/fixture checks](scripts/migration-check.mjs),
[database runbook](docs/supabase.md).

On 2026-10-12, an explicitly authorized one-off import also placed this synthetic
set in the hosted teaching project `vgxoiljieuhvnpuojaet`. Its public marketplace
then contained 106 published roles and 28 companies, including the 25 generated
company identities. New companies store deployed local PNG URLs. Original rows,
applications and memberships were preserved; existing employers still do not
gain access to these 25 organizations. This is not a commercial production seed
or an automatic deployment step. See the [hosted import record](docs/tasks/hosted-marketplace-fixtures.md).

| ID / status        | Entry                               | Flow and result                                                                                                                                                                                                                                                                                                          |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SYS-01 Available   | Shared shells and controls          | Graphical Untitled tokens/components, Base UI shadcn primitives, locally loaded Timeless Grotesk font, Lucide icons, robot brand, responsive navigation, focus/validation/loading/empty states and light/dark/system themes. Theme preference persists in the browser; this is distinct from domain-data persistence.    |
| SYS-02 Available   | Server actions and Supabase         | Session/role checks, Zod validation, organization/candidate RLS, private CV storage, versioned migrations and generated types. Every route/action still needs its own appropriate boundary; robots and hidden UI do not provide security.                                                                                |
| SYS-03 Conditional | `/api/analytics` and server capture | Validate an allowlisted event schema and reject prohibited PII-shaped payloads; hash distinct IDs before sending via server-side PostHog, with EU host default. No project key means no delivery. A 202 response acknowledges handling, not confirmed PostHog ingestion; isolated EU delivery verification remains open. |
| SYS-04 Available   | `/demo`                             | Static dashboard: search/filter/sort table, select current-page rows, pagination and period-responsive chart. Selection/filter state resets on reload; there are no domain writes.                                                                                                                                       |
| SYS-05 Available   | `/demo/settings`, `/components`     | Demonstrate theme persistence and shared buttons, badges, fields, validation, skeleton and dialog form. Component example confirms valid input without saving it. These are starter examples, not candidate/company account features.                                                                                    |
| SYS-06 Tooling     | Local/CI checks                     | Lint, formatting, types, unit tests, build, public/demo browser tests, local Supabase integration/RLS checks, accessibility/reflow tests, Lighthouse and deployment/security smoke scripts. A check's existence does not establish a passing deployed release.                                                           |

Analytics allowlist source: [contract](src/features/analytics/contract.ts).
Current names: `registration_completed`, `candidate_onboarding_viewed`,
`candidate_profile_readiness`, `candidate_profile_updated`, `job_viewed`, `job_saved`,
`application_started`, `application_draft_saved`, `application_reviewed`,
`application_submitted`, `application_withdrawn`, `one_click_used`,
`ai_generation_started`, `ai_generation_completed`, `ai_generation_approved`,
`employer_reviewed`.

Operational recruiting stages/notes remain in Supabase. Current server implementation
also captures `employer_reviewed` with the selected stage; this is more expansive than
the protocol's stage-change telemetry boundary and should be reconciled before release.
An allowlisted event name does not prove every branch emits it or that delivery was tested.

Evidence: [theme guidance](GUI.md), [shared components](src/components/),
[analytics](src/features/analytics/), [database runbook](docs/supabase.md),
[security](docs/SECURITY.md), [demo tests](tests/e2e/demo.spec.ts),
[verification script](scripts/verify).

## Deliberate boundaries and outstanding gaps

- No commercial ATS messaging, calendar booking, outbound recruitment email, newsletter,
  paid listings, autonomous matching or automated hiring. Supabase auth emails are separate.
- No public employer signup, self-service team invitations, general role editing/archive
  UI, automatic geocoding, database-level job pagination, daily expiry cron, or expired-role archive.
- Work samples remain hidden until explicitly re-enabled; existing historical evidence stays.
- Account deletion fulfillment, first-time human observation, independent dataset review,
  clean participant deployment rehearsal, PostHog delivery verification, course provider/cost
  decisions and cohort-release approval are not implied complete by the implemented flows.
- Final release criteria and the current backlog remain in [TODO.md](TODO.md). Keep this
  register accurate even when the backlog has a broader intended scope.

## Route coverage index

| Routes                                                                                               | Entries                   |
| ---------------------------------------------------------------------------------------------------- | ------------------------- |
| `/`, `/oferty`, `/oferty/[slug]`, `/firmy/[slug]`, `/metodologia`, `/polityka-prywatnosci`           | PUB-01–13                 |
| `/robots.txt`, `/sitemap.xml`, not-found/error boundaries                                            | PUB-11–12                 |
| `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/update-password`, `/auth/callback` | AUTH-01–07                |
| `/app`, `/app/onboarding`, `/app/profil`, `/app/profil/podglad`, `/app/zapisane`                     | CAN-01–08, EMP-01         |
| `/aplikuj/[slug]`, `/app/aplikacje`, `/app/aplikacje/[id]`, `/app/aplikacje/[id]/wyslano`            | CAN-09–16                 |
| `/app/settings`, `/api/account/export`                                                               | CAN-17–18, EMP-10, SYS-01 |
| `/app/organizacja`, `/app/oferty`, `/app/oferty/[id]`, `/app/kandydaci`, `/app/kandydaci/[id]`       | EMP-02–09                 |
| `/app/case`, `/app/case/pilot`                                                                       | OPS-01–04                 |
| `/api/analytics`                                                                                     | SYS-03                    |
| `/demo`, `/demo/settings`, `/components`                                                             | SYS-04–05                 |
