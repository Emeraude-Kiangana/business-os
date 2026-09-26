# Security Baseline v0.1

## Secrets

Never commit:
- Supabase secret keys (`sb_secret_...`)
- Tally webhook signing secret
- Cloudflare API tokens
- Brevo API keys
- authorization headers
- production environment files

The backend Supabase key is sent only through the `apikey` header. Opaque `sb_secret_...` keys are not JWTs and must not be duplicated into `Authorization: Bearer`.

## Database

All CP01 tables in the exposed `public` schema have Row Level Security enabled.

CP01 intentionally defines no `anon` or `authenticated` policies. The privileged ingestion RPC is executable by `service_role` only.

The Worker secret key is therefore a high-privilege backend credential and must exist only in Cloudflare/GitHub secret stores.

## Gateway

The gateway:
1. requires complete runtime configuration;
2. accepts only JSON for the Tally webhook;
3. caps webhook bodies at 64 KiB;
4. verifies the Tally HMAC signature before parsing business data;
5. allowlists the exact Tally form ID;
6. validates and bounds canonical input;
7. maps unknown source attribution to `unknown`;
8. rejects unknown services;
9. enforces idempotency through PostgreSQL;
10. times out the Supabase call after 5 seconds;
11. returns `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`;
12. logs only bounded error codes, not payloads or customer PII.

## CI/CD supply chain

GitHub Actions are pinned to immutable full-length commit SHAs.

Deployment is manual, serialized with a concurrency group, and runs the full verification suite before the deployment job receives production secrets.

## Human authorization

Paid upgrades, contracts, destructive data actions, mass outreach, and production secret rotation require explicit human authorization.
