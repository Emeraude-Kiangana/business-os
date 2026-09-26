# ADR-002 — Automation Outside Critical Transaction

Status: Accepted

## Decision

n8n and CRM synchronization are not part of the lead-acceptance transaction.

## Consequences

Lead capture can continue when automation is unavailable. Failed downstream delivery is recorded and recoverable.
