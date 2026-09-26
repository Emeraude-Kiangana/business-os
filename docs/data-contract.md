# Data Contract v0.1

## Intake

```json
{
  "name": "string",
  "email": "string",
  "service": "string",
  "problem": "string",
  "budget_range": "string|null",
  "deadline": "string|null",
  "source": "string",
  "consent": true
}
```

Required: `name`, `email`, `service`, `problem`, `source`, `consent`.

## Normalization

- Trim human-entered strings.
- Normalize email domain casing.
- Map service labels to stable internal service codes.
- Never silently drop source attribution.
- Unknown source is stored explicitly as `unknown`.

## Identifiers

Business identifiers are internal UUIDs. Provider IDs are external references only.

## Event envelope

```json
{
  "event_id": "uuid",
  "event_type": "lead.created",
  "entity_type": "lead",
  "entity_id": "uuid",
  "occurred_at": "ISO-8601",
  "source": "tally",
  "request_id": "string",
  "metadata": {}
}
```

Events are append-only historical records.
