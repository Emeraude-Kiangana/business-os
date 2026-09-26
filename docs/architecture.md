# Architecture v0.1

## Critical path

```text
Visitor
  -> Tally
  -> Cloudflare Worker
  -> Supabase PostgreSQL
```

## Secondary path

```text
Supabase
  -> Brevo
  -> optional n8n automation
```

## System of record

Supabase PostgreSQL is authoritative for business state.

Tally is an intake provider. Brevo is a CRM projection. n8n is an automation executor. None of them owns canonical lead state.

## Layers

1. Experience — public service pages and intake.
2. Gateway — validation, signature verification, idempotency and routing.
3. Domain — contacts, leads, events and consent.
4. Data — PostgreSQL.
5. Provider adapters — Tally, Brevo and later replaceable providers.
6. Automation — non-critical workflows only.
7. Governance — cost guard, evidence and human authorization.

## CP01 transaction boundary

A lead is accepted only after:

```text
VALID REQUEST
+ CONTACT PERSISTED
+ LEAD PERSISTED
+ LEAD EVENT PERSISTED
= ACCEPTED LEAD
```

CRM sync is not part of this transaction boundary.

## Security boundary

External input is untrusted. Service-role database credentials remain server-side only. No browser code may receive a Supabase service-role key.
