# User-flow audit repairs

Date: 2026-10-22. Branch: `codex/user-flow-audit-fixes`.

## Intent and acceptance

Repair the confirmed native-browser audit findings, starting with credential-form
safety. Preserve Graphical Untitled, the course experiment boundaries, private source
data and normal-user RLS. Do not reset the existing local database or modify production.

- Credential forms must never submit secrets through GET, including before hydration
  and when JavaScript is unavailable. Normal sign-in, signup and account-role checks work.
- Invalid manual offers preserve every input and identify/focus the invalid field.
- Role-specific brief links select an authorized role in both editing and generation.
- Mobile account navigation includes sign-out; filters reflect URL and authorized jobs.
- Candidate experience ordering persists atomically; completed applications include hiring.
- Owner role previews format descriptions, brief IDs are unique, approved edits remain visible.
- Copy does not promise messages that the application does not send or claim human AI edits
  before they happen. Small CV files have readable sizes.
- Add regression coverage, update FEATURES/TODO, run project verification and retest
  corrected flows in the native browser. Record actual results and remaining boundaries.

## Confirmed audit findings closed

| Finding    | Repair and evidence                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-01     | Explicit POST fallback, disabled pre-hydration fieldset, safe uncached failure; regressions cover no JS, aborted JS, delayed scripts and authenticated reset form. Native candidate/employer logins succeeded. |
| UX-01      | Failed manual offers retain raw values through keyed action-state rendering; salary and duplicate-slug errors focus the correction. Automated and native salary retests passed.                                |
| UX-02      | Owner links retain validated job IDs; native non-default Product Manager selected in both brief and generator.                                                                                                 |
| UX-03      | Mobile menu exposes account/sign-out and scrolls at small heights; native 390px sign-out and browser regression passed.                                                                                        |
| UX-04      | Inbox options query organization memberships and show title/slug. Native BrightLabs dropdown contains four owned roles, not 106 marketplace offers.                                                            |
| UX-05      | Public form remounts from URL state; native Clear and automated clear/back/forward passed.                                                                                                                     |
| UX-06      | Explicit submit buttons, append-order triggers, ownership checks and transactional reorder. Native audit Analyst moved below Manager and survived reload. Two-account RPC regression passed.                   |
| UX-07      | Completed includes hired and rejected; distinct hired/rejected filters remain. Native audited 7% rejected and 22.4% hired cards both appeared.                                                                 |
| UX-08      | Owner preview uses the shared escaped heading/list renderer, including private review offers. Native audit offer rendered headings/lists.                                                                      |
| A11Y-01    | Unique brief anchor/textarea IDs and correct label association; regression checks both.                                                                                                                        |
| COPY-01/02 | Back-to-offers uses `/oferty`; invalid-login copy no longer mentions account confirmation.                                                                                                                     |

Additional repairs: approved AI edits remain visible/read-only and can be reopened as
private versions; AI provenance no longer assumes edits; fixture punctuation and KB
sizes corrected. Recruiting controls explain stage-only recording and external contact.
Exact coincident map coordinates share linked role groups. Native retesting also exposed
MapLibre keypress/native-button double activation; an application-owned keydown handler
now opens Enter/Space popups once, covered by public browser tests.

## Verification and review

### Release gate follow-up

The user authorized push, PR, merge and production deployment. PR #5 CI exposed the
pre-existing listing Lighthouse regression (88 versus the required 90), also reproduced
locally at 86. A diagnostic found the roughly 1 MB uncompressed MapLibre module loaded
on list-only visits. Defer the library itself until the map mounts, retain server-rendered
role links and map behavior, guard asynchronous teardown and repeat the unchanged gates
before merging. This is a release performance repair, not a Graphical redesign or lowered threshold.

The follow-up passed `./scripts/verify`, 21 public/demo browser tests (including a list-only
JavaScript bundle budget and map keyboard interaction), and the unchanged three-sample
Lighthouse gate: Performance 92/90/92, Accessibility 96/95/100, Best Practices and SEO 100
for home/listing/role respectively. Separate review checked cancellation before library
resolution, idempotent cleanup, safe fallback text, retained SSR links, unchanged map
interactions and no token/dependency/lockfile changes. CI must still pass before merge.

- `./scripts/verify`: passed (lint, 71 unit tests, production build/type validation).
- Public/demo E2E: 20 passed, including keyboard map popups, no-JS browsing, URL history,
  responsive layouts and automated WCAG A/AA checks on selected screens.
- Integration: 34 passed against a separate local Supabase stack on 554xx and app port 3108. Includes immediate signup/no signup mail, login/recovery, manual/AI applications,
  employer decisions, organizations, operator releases, snapshots, Storage, RLS and audit regressions.
- Migration gate: 14 migrations from zero, seed, 24 RLS tables, 100 marketplace roles,
  idempotency/privacy checks passed in PGlite. The new order migration was applied in
  place to the existing 553xx developer stack without resetting its data.
- Formatting, security scan and separate full-diff review: passed. No dependency or lockfile changes.
- Native IAB: repeated candidate/employer login, persistence after experience reorder,
  completed/hired history, mobile logout, failed manual creation, formatted owner preview,
  non-default brief routing, AI edit approval/reopen, owned inbox filters, public Clear,
  grouped map keyboard interaction and dark dropdown styling. Graphical tokens/components,
  modes and portal typography were retained; no theme conversion or global token change.

The standard integration runner resets its default stack. This run used an isolated
temporary config/runner with copied migrations/seed and separately provisioned synthetic
fixtures. Initial iterations fixed test locator mistakes and added an explicit fixture
workdir/mismatched-target guard; the last complete run passed 34/34. The first marketplace
supplement invocation targeted the existing already-seeded local stack idempotently; no
reset or intended record overwrite occurred there. Subsequent runs targeted only 554xx.
During rapid marketplace navigation, Next logged `The destination stream closed early`;
functional assertions passed. This is not a claim of completely clean server logs.

Review checked: fail-closed SSR/auth semantics, POST body non-reflection, role/RLS guards,
private version visibility, form value retention, distinct IDs, database transaction and
two-account isolation, dependency stability and FEATURES.md coverage. No unresolved
finding among the twelve prioritized audit defects remains.

## Preserved boundaries and test-data ledger

- Native retest modified only audit-created profile order and saved private version 4
  for audit job `91f87bf2-5dc1-41a9-9ad3-a35f712c33c2`. An invalid retry offer was not submitted.
- Existing public roles, candidate submissions, Match Score algorithm, case release and
  real production data/auth settings were not intentionally changed.
- Nearby but different coordinates can still overlap at small zoom; exact-coordinate
  grouping is not full spatial clustering/spiderfying. Zoom and the accessible list remain available.
- No outbound recruiter messaging, publishing/moderation UI, legal notice authoring,
  deletion fulfillment, real-provider evaluation or real-person research was added.
- Native password/email changes and permanent deletion were not performed. Automated
  recovery uses only isolated disposable fixtures. No production deployment or CI run is claimed.
- Native screenshots `fix-01` through `fix-12` accompany the original local audit artifact.
