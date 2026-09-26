# ADR-001 — PostgreSQL as System of Record

Status: Accepted

## Decision

Canonical business state lives in PostgreSQL.

## Consequences

- CRM/provider data can be reconstructed from canonical state.
- Provider IDs never become internal business identifiers.
- Provider outages do not invalidate accepted leads.
