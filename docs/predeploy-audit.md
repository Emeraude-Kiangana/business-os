# BOS-CP01 Pre-Deployment Audit

Date: 2026-09-26

## Result

```text
CODE / DATABASE / CI: READY
PUBLIC DEPLOYMENT: AWAITING ACCOUNT SECRETS
PRODUCTION CLAIM: NONE
```

## Critical findings corrected

1. Supabase opaque secret keys were being duplicated into `Authorization: Bearer`. Corrected to `apikey` only.
2. GitHub Actions used mutable major-version tags. All workflow actions are now pinned to full commit SHAs.
3. Deployment previously lacked a mandatory verification job. Deployment now depends on tests passing.
4. Worker secrets were implicit. Wrangler now declares both production secrets as required.
5. Webhook input lacked explicit media-type and body-size guards. Added JSON-only and 64 KiB limits.
6. Supabase request had no bounded timeout. Added a 5-second timeout to stay below Tally's delivery window.
7. Service/source values were too permissive. Added canonical allowlists/fail-closed behavior.
8. UTM data was collected by Tally but discarded. Attribution is now stored in the `lead.created` event metadata.
9. Error logging could contain backend response detail. Logs now expose error codes only.
10. Form privacy language and input-size constraints were strengthened.

## Verified controls

- Six CP01 tables use RLS.
- No `anon` / `authenticated` execution grant exists on `ingest_lead`.
- `service_role` retains RPC execution.
- Supabase performance advisors: no findings.
- Database currently contains zero contacts, leads, events, consents, idempotency rows, or provider deliveries.
- Synthetic ingestion/idempotency tests are performed with rollback.
- GitHub repository secret scan found no committed Supabase secret, JWT, Cloudflare token, or Tally signing secret.

## Accepted informational advisor

Supabase reports `RLS Enabled No Policy` for the six tables.

This is intentional for CP01: browser/public database access is not part of the architecture. No permissive policy will be added merely to silence the advisor.

## Remaining deployment gates

- GitHub/Cloudflare secrets configured.
- Worker deployment succeeds.
- Public `GET /health` returns 200.
- Tally webhook is registered with signing secret.
- One controlled real-form E2E submission reaches PostgreSQL.
- Resulting contact/lead/consent/event/idempotency records are inspected.
- Replay behavior is verified.
- Evidence manifest is frozen only after the above pass.
