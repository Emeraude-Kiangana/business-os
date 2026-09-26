# Security Baseline v0.1

## Secrets

Never commit:
- Supabase service-role / secret keys
- Tally webhook signing secret
- Brevo API key
- authorization headers
- production environment files

## Database

All tables created in the Supabase exposed `public` schema must have Row Level Security enabled. CP01 creates no public client policies: the gateway is the only intended privileged writer.

## Gateway

The gateway must:
1. reject malformed input;
2. verify webhook authenticity before accepting provider events;
3. enforce idempotency;
4. avoid logging secrets or raw sensitive payloads;
5. return bounded, non-sensitive errors.

## Human authorization

Paid upgrades, contracts, destructive data actions and mass outreach require explicit human authorization.
