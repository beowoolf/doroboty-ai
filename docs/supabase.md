# Supabase

The public marketplace can run without Supabase or Docker by using deterministic fixtures. Authenticated case workflows require Supabase. Versioned migrations contain the domain model, RLS, experiment controls, AI provenance, and analysis view.

## Cloud project

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Enter the URL and publishable key from the Connect panel. A legacy anon key also works. **Never use a service_role or secret key.**
3. In Auth, set Site URL to the application URL. Add `/auth/callback` to Redirect URLs with its parameters: `/auth/callback?next=/app` and `/auth/callback?next=/auth/update-password`. For local development, use `http://localhost:3000` and the equivalent callback URLs.
4. Enable email confirmation. Copy `supabase/templates/confirmation.html` and `recovery.html` into the Confirm signup and Reset password templates in the Auth panel. Our forms always set RedirectTo with a next parameter. Do not use these templates in other clients without that parameter.
5. Connect your own SMTP service before sharing the application with users, and verify email delivery. The local test mailbox is not an email delivery service.
6. Restart `npm run dev` and open `/app`.

After signing in, candidates see profiles and applications, employers see jobs and their candidate inbox, and operators see release controls and case analysis. Incomplete configuration shows setup instructions without pretending authenticated data is available.

## Local integration tests

Docker must be running. The Supabase CLI is a development dependency:

```sh
npm run db:start
npx playwright install chromium
npm run test:integration
npm run db:stop
```

The first start downloads images. Configured ports: 55321 for the API, 55322 for the database, 55323 for Studio, 55324 for the Mailpit test mailbox, and 3107 for the test application. Do not run demo and integration tests in parallel: both rebuild `.next`.

The integration script reads the public key from the local CLI, rejects remote URLs, and builds the application against the local stack. It does not save keys to the repository. Tests cover auth and independent sessions; domain integration scenarios extend this suite. Emails go only to the local mailbox.

**The integration script resets its local database.** If the normal development stack
contains data you want to keep, run integration tests from an isolated checkout with a
different Supabase `project_id` and unused API/database/shadow/Studio/mail ports. Do not
run the suite against the user's active database. Stop only the isolated stack afterward.

`npm run db:reset` deletes **local** data and reapplies migrations. Do not use it for a normal start; tests create unique accounts. After integration tests, `npm run test:e2e` rebuilds the application without Supabase configuration. Local email rate limits are increased only for tests.

The callback supports PKCE code and token_hash. Only allowlisted local application paths are accepted as redirect targets. Expired or invalid links lead to an error message on the sign-in screen.

## Optional local marketplace volume

With the local stack running, add 100 published synthetic jobs across 25 fictional
companies without resetting data:

```sh
npm run db:seed-marketplace
```

The command validates the local CLI database URL and Docker container/port, then applies
`supabase/marketplace-fixtures.sql` in one transaction. Stable reserved IDs and conflict
handling make reruns nonduplicating and preserve edits to existing records. A conflicting
slug fails the transaction rather than overwriting another record. Companies use reserved
`.invalid` websites; roles clearly identify themselves as fictional. All jobs include map
coordinates, an organization, a private source brief and an approved public text version.
No users or organization memberships are added. Existing employers therefore cannot manage
these companies; use an operator for authorized inspection, or explicitly provision an
employer for one company separately. Candidates can browse and apply normally.

This supplement is deliberately opt-in and is not included in `db:reset` or the canonical
six-job course seed. After an intentional local reset, run it again if needed. It does not
alter staged synthetic learning datasets. `npm run db:check` checks the supplement's
relationships, variety, rerun preservation and access boundaries against the migrated schema.

## Domain deployment

### Authorized hosted teaching fixture import

On 2026-10-12, the user explicitly requested the optional 100-role/25-company
set on the hosted teaching application. A reviewed one-off transaction targeted
only `vgxoiljieuhvnpuojaet`, retained synthetic notices and reserved IDs, assigned
deployed logo URLs and preserved pre-existing records and memberships. The hosted
list reached 106 published roles across 28 companies. See the
[operation record](tasks/hosted-marketplace-fixtures.md).

This does not weaken the local-only runner or authorize seeding another cloud
project. Code deployment and data import are separate operations. Future cloud
imports require an explicit target and user authorization, preflight counts and
collision checks, transaction boundaries, preservation checks and public-page
verification. Never import real personal data or reset a hosted database for fixtures.

### Schema deployment

Before deployment, run `npx supabase db push --dry-run` against the intended project, review every migration, and test RLS with candidate, employer, other-organization, operator, and anonymous sessions. Never use `db reset` against a remote or production project.

For an explicitly isolated rehearsal project, `npm run case:rehearsal-accounts` can create the
synthetic role accounts without email delivery. It requires the exact project ref, matching project
URL, a generated rehearsal password, a scoped `sb_secret_` key (or a verified legacy
`service_role` key when Auth Admin does not accept the scoped key), and
`CONFIRM_REMOTE_REHEARSAL=CREATE_SYNTHETIC_USERS_ONLY`. Supply these values only as process
environment variables from a secret manager. The command is idempotent, uses reserved `.invalid`
addresses, and never prints credentials. Never run it against a real-user or shared production
project.
