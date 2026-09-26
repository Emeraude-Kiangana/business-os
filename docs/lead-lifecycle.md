# Lead Lifecycle v0.1

Canonical states:

```text
NEW
 -> QUALIFIED
 -> CONTACTED
 -> PROPOSAL
 -> WON

PROPOSAL -> LOST
```

CP01 operationally requires only `NEW`.

## Invariants

- No lead without a source.
- No accepted lead without a database record.
- No state change without an event.
- Invalid transitions fail closed.
- A provider outage must not erase canonical lead state.
