# Tally Intake Integration

## Canonical form

- Form ID: `zxlAbR`
- Status: `PUBLISHED`
- Title: `#0$ BUSINESS OS — Client Intake v0.1`

## Current controls

- CAPTCHA enabled.
- Name constrained to 1–120 characters.
- Problem description constrained to 10–4000 characters.
- Consent is required.
- Deadline is optional.
- Hidden attribution fields:
  - `source`
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
- A privacy notice states that the data is used to process and respond to the service request and does not grant marketing consent.

## Contract stability

The current gateway maps Tally fields by their exact labels. These labels are therefore part of the CP01 integration contract and MUST NOT be renamed without updating tests and the normalizer:

- `Nom`
- `Email`
- `Service recherché`
- `Quel problème veux-tu résoudre ?`
- `Échéance souhaitée`
- `Budget indicatif`
- `Consentement`
- `source`
- `utm_source`
- `utm_medium`
- `utm_campaign`

Tally webhook payloads also expose field keys. A future checkpoint may migrate to a key registry after capturing the first real webhook payload and freezing those keys.

## Webhook

Pending public Worker deployment:

```text
POST https://<worker-host>/v1/webhooks/tally
```

The webhook MUST use a signing secret. The same value is stored only as `TALLY_WEBHOOK_SECRET` in the Cloudflare/GitHub secret path.

## Reliability

Tally retries failed webhook delivery. CP01 therefore treats Tally event IDs as idempotency keys so retries cannot create duplicate leads.

## Cost guard

No paid Tally capability is required by CP01.

A 30-day automatic submission-retention policy was evaluated but is available only on Tally Business, so it remains BLOCKED. Retention must be handled operationally until a paid tier is justified.
