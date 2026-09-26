# Cost Registry v0.1

This registry is a governance artifact, not a promise that provider pricing will remain unchanged.

| Provider | Capability | Cost class | CP01 policy |
|---|---|---|---|
| GitHub | source, CI, evidence | FREE / FREE_TIER | ALLOW |
| Cloudflare Pages | static frontend | FREE_TIER | ALLOW |
| Cloudflare Workers | API gateway | FREE_TIER | ALLOW WITH LIMIT MONITORING |
| Tally | intake + webhook | FREE / FAIR-USE | ALLOW |
| Supabase | PostgreSQL | FREE_TIER | ALLOW WITH LIMIT MONITORING |
| Brevo | CRM + email | FREE_TIER | ALLOW AS SECONDARY |
| n8n Community | local automation | NATIVE_0 | ALLOW LOCALLY |
| Custom domain | vanity domain | PAID_INFRA | BLOCK CP01 |
| Paid provider upgrades | scale | PAID_INFRA | BLOCK WITHOUT EXPLICIT APPROVAL |

## Rule

```text
UNKNOWN COST = BLOCK
```

Pricing and quotas must be re-verified before any production dependency or paid upgrade.
