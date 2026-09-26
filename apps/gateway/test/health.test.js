import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../src/index.js";

test("GET /health returns canonical service status", async () => {
  const response = handleRequest(
    new Request("https://business-os.invalid/health", { method: "GET" })
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "business-os-gateway",
    version: "0.1.0"
  });
});

test("unknown route fails closed", async () => {
  const response = handleRequest(
    new Request("https://business-os.invalid/unknown", { method: "GET" })
  );

  assert.equal(response.status, 404);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "NOT_FOUND");
});
