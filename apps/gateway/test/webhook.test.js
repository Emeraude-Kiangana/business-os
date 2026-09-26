import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../src/index.js";

async function sign(body, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  return Buffer.from(new Uint8Array(signature)).toString("base64");
}

function validPayload() {
  return {
    eventId: "evt_test_gateway",
    eventType: "FORM_RESPONSE",
    data: {
      formId: "zxlAbR",
      fields: [
        { label: "Nom", value: "Synthetic Client" },
        { label: "Email", value: "synthetic@example.com" },
        { label: "Service recherché", value: "GitHub Setup" },
        { label: "Quel problème veux-tu résoudre ?", value: "Synthetic integration test." },
        { label: "Budget indicatif", value: "À définir" },
        { label: "Consentement", value: ["yes"] },
        { label: "source", value: "ci-test" }
      ]
    }
  };
}

test("unsigned Tally webhook fails closed", async () => {
  const body = JSON.stringify(validPayload());
  const request = new Request("https://gateway.invalid/v1/webhooks/tally", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  });

  const response = await handleRequest(request, {
    TALLY_WEBHOOK_SECRET: "secret",
    TALLY_FORM_ID: "zxlAbR"
  });

  assert.equal(response.status, 401);
});

test("valid Tally webhook persists through RPC adapter boundary", async () => {
  const body = JSON.stringify(validPayload());
  const secret = "secret";
  const signature = await sign(body, secret);
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /\/rest\/v1\/rpc\/ingest_lead$/);
    const rpc = JSON.parse(init.body);
    assert.equal(rpc.p_email, "synthetic@example.com");
    assert.equal(rpc.p_service_code, "SERVICE_GITHUB_SETUP");

    return Response.json({
      ok: true,
      contact_id: "00000000-0000-0000-0000-000000000001",
      lead_id: "00000000-0000-0000-0000-000000000002",
      status: "NEW"
    });
  };

  try {
    const request = new Request("https://gateway.invalid/v1/webhooks/tally", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "tally-signature": signature
      },
      body
    });

    const response = await handleRequest(request, {
      TALLY_WEBHOOK_SECRET: secret,
      TALLY_FORM_ID: "zxlAbR",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-only"
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.data.status, "NEW");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
