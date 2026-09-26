# #0$ BUSINESS OS

A cost-guarded, evidence-first business operating system for turning verified technical capability into real client revenue.

## Status

- Version: 0.1.0
- Stage: BOS-CP01 — Lead Capture Foundation
- Current checkpoint: BOS-CP01-A — Canonical Repository + Data Contract
- Production claim: none
- Revenue claim: none

## Doctrine

TOOL-FIRST · API-FIRST · #0$-FIRST · EVIDENCE-FIRST · COST-GUARDED · VENDOR-INDEPENDENT

## Critical path

```text
Tally -> Cloudflare Worker -> Supabase PostgreSQL
```

Supabase PostgreSQL is the canonical system of record. Brevo and n8n are secondary projections/automation layers and are not required for accepting a lead.

## Core invariants

- No lead without source.
- No accepted lead without a canonical database record.
- No status change without an event.
- No provider is the system of record.
- No secrets in version control.
- No unknown cost on the critical path.
- No critical automation without a manual fallback.
- No claim without evidence.

## Repository

See `docs/architecture.md`, `docs/data-contract.md`, `docs/lead-lifecycle.md`, and `docs/cost-registry.md`.

## License

Apache-2.0.
