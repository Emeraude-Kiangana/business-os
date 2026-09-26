import { ingestLead } from "./supabase.js";
import { normalizeTallyPayload, verifyTallySignature } from "./tally.js";

const MAX_WEBHOOK_BYTES = 64 * 1024;

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

export async function handleRequest(request, env = {}) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/health") {
    return json({
      ok: true,
      service: "business-os-gateway",
      version: "0.1.0"
    });
  }

  if (request.method === "POST" && url.pathname === "/v1/webhooks/tally") {
    if (
      !env.TALLY_WEBHOOK_SECRET ||
      !env.TALLY_FORM_ID ||
      !env.SUPABASE_URL ||
      !env.SUPABASE_SECRET_KEY
    ) {
      return json(
        {
          ok: false,
          error: {
            code: "CONFIGURATION_ERROR",
            message: "Gateway is not fully configured"
          }
        },
        500
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return json(
        {
          ok: false,
          error: {
            code: "UNSUPPORTED_MEDIA_TYPE",
            message: "Expected application/json"
          }
        },
        415
      );
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
      return json(
        {
          ok: false,
          error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "Webhook payload exceeds allowed size"
          }
        },
        413
      );
    }

    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) {
      return json(
        {
          ok: false,
          error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "Webhook payload exceeds allowed size"
          }
        },
        413
      );
    }

    const signature = request.headers.get("tally-signature");

    const validSignature = await verifyTallySignature(
      rawBody,
      signature,
      env.TALLY_WEBHOOK_SECRET
    );

    if (!validSignature) {
      return json(
        {
          ok: false,
          error: {
            code: "SIGNATURE_ERROR",
            message: "Invalid webhook signature"
          }
        },
        401
      );
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid JSON payload"
          }
        },
        400
      );
    }

    if (payload?.data?.formId !== env.TALLY_FORM_ID) {
      return json(
        {
          ok: false,
          error: {
            code: "FORM_NOT_ALLOWED",
            message: "Webhook form is not allowed"
          }
        },
        403
      );
    }

    let lead;
    try {
      lead = normalizeTallyPayload(payload);
    } catch (error) {
      const code =
        error?.message === "UNSUPPORTED_EVENT_TYPE"
          ? "UNSUPPORTED_EVENT_TYPE"
          : "VALIDATION_ERROR";

      return json(
        {
          ok: false,
          error: {
            code,
            message: "Webhook payload failed validation"
          }
        },
        400
      );
    }

    if (!lead.idempotencyKey) {
      return json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Webhook has no stable idempotency key"
          }
        },
        400
      );
    }

    try {
      const result = await ingestLead(env, lead);

      if (result?.code === "IDEMPOTENCY_REPLAY_PENDING") {
        return json(
          {
            ok: false,
            error: {
              code: "IDEMPOTENCY_REPLAY_PENDING",
              message: "Prior request is still being resolved"
            }
          },
          409
        );
      }

      return json({
        ok: true,
        data: result
      });
    } catch (error) {
      const code =
        error?.name === "TimeoutError"
          ? "DATABASE_TIMEOUT"
          : error?.message === "CONFIGURATION_ERROR"
            ? "CONFIGURATION_ERROR"
            : "DATABASE_ERROR";

      console.error("lead_ingest_failed", { code });

      return json(
        {
          ok: false,
          error: {
            code,
            message: "Lead could not be persisted"
          }
        },
        500
      );
    }
  }

  return json(
    {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found"
      }
    },
    404
  );
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  }
};
