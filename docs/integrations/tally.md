# Tally Intake Integration

## Canonical form

- Form ID: `zxlAbR`
- Status: `PUBLISHED`
- URL: https://tally.so/r/zxlAbR
- Title: `#0$ BUSINESS OS — Client Intake v0.1`

## Fields

Required:
- Name
- Email
- Service
- Problem / need
- Consent

Operational:
- Budget range includes `À définir`
- Deadline is optional
- CAPTCHA enabled

Hidden attribution fields:
- `source`
- `utm_source`
- `utm_medium`
- `utm_campaign`

## Pending CP01-D

The webhook is intentionally not configured yet because the Cloudflare Worker public endpoint does not exist yet.

After Worker deployment:

```text
POST https://<worker-host>/v1/webhooks/tally
```

must be configured in Tally with a signing secret. The same secret must be stored only in the Cloudflare secret store.

## Cost boundary

The form uses no Pro-only feature required by CP01. Link-preview metadata was not applied because it requires Tally Pro and is non-essential, so the Cost Guard blocks that upgrade.
