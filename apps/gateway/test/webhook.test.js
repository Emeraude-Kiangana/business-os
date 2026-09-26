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

function env() {
  return {
    TALLY_WEBHOOK_SECRET: "secret",
    TALLY_FORM_ID: "zxlAbR",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SECRET_KEY: "test-only"
  };
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
        { label: "source", value: "portfolio" },
        { label: "utm_source", value: "x" },
        { label: "utm_medium", value: "social" },
        { label: "utm_campaign", value: "launch" }
      ]
    }
  };
}

test("incomplete gateway configuration fails closed", async () => {
  const response = await handleRequest(
    new Request("https://gateway.invalid/v1/webhooks/tally", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload())
    }),
    { TALLY_WEBHOOK_SECRET: "secret" }
  );

  assert.equal(response.status, 500);
  assert.equal((await response.json()).error.code, "CONFIGURATION_ERROR");
});

test("non-json webhook is rejected", async () => {
  const response = await handleRequest(
    new Request("https://gateway.invalid/v1/webhooks/tally", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}"
    }),
    env()
  );

  assert.equal(response.status, 415);
});

test("oversized webhook is rejected before signature verification", async () => {
  const response = await handleRequest(
    new Request("https://gateway.invalid/v1/webhooks/tally", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(70 * 1024)
      },
      body: "{}"
    }),
    env()
  );

  assert.equal(response.status, 413);
});

test("unsigned Tally webhook fails closed", async () => {
  const body = JSON.stringify(validPayload());
  const response = await handleRequest(
    new Request("https://gateway.invalid/v1/webhooks/tally", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body
    }),
    env()
  );

  assert.equal(response.status, 401);
});

test("valid Tally webhook uses apikey-only Supabase secret and persists attribution", async () => {
  const body = JSON.stringify(validPayload());
  const secret = "secret";
  const signature = await sign(body, secret);
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /\/rest\/v1\/rpc\/ingest_lead$/);
    assert.equal(init.headers.apikey, "test-only");
    assert.equal(init.headers.authorization, undefined);

    const rpc = JSON.parse(init.body);
    assert.equal(rpc.p_email, "synthetic@example.com");
    assert.equal(rpc.p_service_code, "SERVICE_GITHUB_SETUP");
    assert.deepEqual(rpc.p_attribution, {
      utm_source: "x",
      utm_medium: "social",
      utm_campaign: "launch"
    });

    return Response.json({
      ok: true,
      contact_id: "00000000-0000-0000-0000-000000000001",
      lead_id: "00000000-0000-0000-0000-000000000002",
      status: "NEW"
    });
  };

  try {
    const response = await handleRequest(
      new Request("https://gateway.invalid/v1/webhooks/tally", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "tally-signature": signature
        },
        body
      }),
      env()
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");

    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.data.status, "NEW");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
