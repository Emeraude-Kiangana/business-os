import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTallyPayload, verifyTallySignature } from "../src/tally.js";

async function sign(body, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
  );
  return Buffer.from(bytes).toString("base64");
}

test("Tally HMAC signature verifies", async () => {
  const raw = JSON.stringify({ eventId: "evt_test" });
  const secret = "test-secret";
  const signature = await sign(raw, secret);

  assert.equal(await verifyTallySignature(raw, signature, secret), true);
  assert.equal(await verifyTallySignature(raw, signature, "wrong-secret"), false);
});

test("Tally payload normalizes to canonical lead contract", () => {
  const payload = {
    eventId: "evt_test_001",
    eventType: "FORM_RESPONSE",
    data: {
      formId: "zxlAbR",
      submissionId: "sub_001",
      fields: [
        { label: "Nom", value: "Synthetic Client" },
        { label: "Email", value: "TEST@EXAMPLE.COM" },
        {
          label: "Service recherché",
          value: "opt_api",
          options: [{ id: "opt_api", text: "API Automation" }]
        },
        { label: "Quel problème veux-tu résoudre ?", value: "Connect two test APIs." },
        { label: "Échéance souhaitée", value: null },
        {
          label: "Budget indicatif",
          value: "opt_budget",
          options: [{ id: "opt_budget", text: "À définir" }]
        },
        {
          label: "Consentement",
          value: ["opt_yes"],
          options: [{ id: "opt_yes", text: "J’accepte" }]
        },
        { label: "source", value: "ci-test" }
      ]
    }
  };

  assert.deepEqual(normalizeTallyPayload(payload), {
    provider: "tally",
    idempotencyKey: "evt_test_001",
    requestId: "evt_test_001",
    formId: "zxlAbR",
    name: "Synthetic Client",
    email: "test@example.com",
    serviceCode: "SERVICE_API_AUTOMATION",
    problemSummary: "Connect two test APIs.",
    budgetRange: "À définir",
    deadline: null,
    source: "ci-test",
    consent: true
  });
});
