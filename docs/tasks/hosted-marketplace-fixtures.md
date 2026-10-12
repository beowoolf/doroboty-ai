# Hosted teaching marketplace fixtures

## Intent and acceptance

On 2026-10-12 the user explicitly requested the missing 100 fictional roles and
company artwork on the already deployed teaching application. Deployment alone
had shipped the PNG assets and code, not the separate local database contents.

- Target only the existing `vgxoiljieuhvnpuojaet` teaching project.
- Add 100 synthetic published jobs, 25 companies/organizations, private source
  briefs and approved public text versions from the existing fixture definition.
- Set local deployed PNG logo URLs for the newly inserted companies; keep the
  synthetic-recruitment notices and reserved `.invalid` company websites.
- Preserve previous rows, applications and organization memberships. No reset,
  schema changes, account provisioning or general remote-seeder capability.
- Check deployed list pages, images, company details and native pagination.
- Update the product register and runbook; distinguish cloud verification from
  previous local fixture tests and the unrelated Lighthouse exception.

## Import and verification

The reviewed one-off transaction used the existing supplement SQL, with a
preflight requiring unused reserved fixture IDs, environment-neutral fictional
company descriptions and logo URLs assigned only to the new fixture companies.
The normal `npm run db:seed-marketplace` runner remains local-only.

Before: 6 published jobs, 3 companies, 0 applications, 2 memberships. After:
106 published jobs, 28 companies, 0 applications, 2 memberships. Exactly 100 jobs
and 25 companies belong to the reserved fixture IDs. Database-side hashes of all
pre-existing jobs and companies matched before/after. No auth users, memberships,
canonical course-release datasets or old records were changed.

Public deployed HTTP checks returned 200 with 20 list rows on pages 1/2, six on
page 6 and five logo instances on the four-role Kobalt Labs company page.
Browser verification traversed all six deployed pages: 106 unique role links,
25 company marks loaded, company/role navigation working, no-JavaScript next-page
navigation working, and no horizontal overflow or WCAG A/AA violations at 390px
in dark mode. Desktop and mobile screenshots were visually reviewed.

A read-only transaction as database role `anon` confirmed all 100 fixture jobs
are public while their 100 private source briefs are inaccessible. No authenticated
production accounts were used or modified. The final code verifier passed in an
isolated source copy: lint, 61 unit tests, TypeScript and production build.

Separate review confirmed this is a hosted-data operation, not a new feature gate
or schema change. The local-only runner and staged learning data stay unchanged;
no new runtime deployment is required. The prior accepted Lighthouse exception is
unrelated and remains unresolved. All 26 integration tests passed against the
separate local `doroboty-marketplace-tests` stack, including repeat-seed
preservation, candidate journeys, private briefs and employer boundaries.
Next emitted destination-stream cancellation messages during rapid navigations;
assertions passed, so this is not a claim of warning-free runtime logs.
