# Case Forge — employer evidence card

## Intent

Extend the employer application detail with a prepared **dowody vs deklaracje** card and verification questions (Idea B from AIPH discovery). Recruiter persona Karolina reviews BrightLabs applications and can distinguish checkable evidence from claims before inviting.

## Acceptance

1. Employer detail `/#/app/kandydaci/:id` shows the card for seeded applications (not on candidate view).
2. List `/#/app/kandydaci` shows evidence/declaration counts when a prepared card exists.
3. Seed includes enough applications for ranking (Marek + Anna + Piotr on BrightLabs AI Product Manager).
4. Card content is static scenario data — no LLM call. UI states this clearly.
5. Existing stage transitions, notes, Match Score and Answer/CV sheets still work.
6. Poster People host tokens/outlined surfaces; no parallel visual system.

## Out of scope

Live AI extraction, candidate work-sample flow (Idea A), production persistence.
