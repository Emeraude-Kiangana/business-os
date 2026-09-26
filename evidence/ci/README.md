# BOS-CP01 CI Proof

This branch exists only to trigger and verify the canonical pull-request CI workflow.

Expected verification:

```text
node --test
→ health tests
→ Tally HMAC + normalization tests
→ webhook acceptance boundary tests
```

No production deployment is performed by this proof branch.
