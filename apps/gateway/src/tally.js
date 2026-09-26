const textEncoder = new TextEncoder();

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function verifyTallySignature(rawBody, receivedSignature, signingSecret) {
  if (!receivedSignature || !signingSecret) return false;

  let signatureBytes;
  try {
    signatureBytes = decodeBase64(receivedSignature);
  } catch {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    textEncoder.encode(rawBody)
  );
}

function fieldByLabel(fields, label) {
  return fields.find((field) => field?.label === label) ?? null;
}

function choiceText(field) {
  if (!field) return null;
  const { value } = field;

  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") {
    const candidate = String(value);
    const option = field.options?.find((item) => String(item?.id) === candidate);
    return option?.text ?? candidate;
  }

  if (Array.isArray(value)) {
    const mapped = value.map((entry) => {
      if (typeof entry === "string" || typeof entry === "number") {
        const option = field.options?.find((item) => String(item?.id) === String(entry));
        return option?.text ?? String(entry);
      }
      return entry?.text ?? entry?.label ?? entry?.name ?? String(entry);
    });
    return mapped.filter(Boolean).join(", ");
  }

  return value?.text ?? value?.label ?? value?.name ?? JSON.stringify(value);
}

function checkboxAccepted(field) {
  if (!field) return false;
  if (Array.isArray(field.value)) return field.value.length > 0;
  return field.value === true || field.value === "true" || Boolean(field.value);
}

const SERVICE_CODES = new Map([
  ["GitHub Setup", "SERVICE_GITHUB_SETUP"],
  ["CI/CD", "SERVICE_CICD"],
  ["API Automation", "SERVICE_API_AUTOMATION"],
  ["Dockerization", "SERVICE_DOCKERIZATION"],
  ["FFmpeg Automation", "SERVICE_FFMPEG_AUTOMATION"],
  ["Backend Prototype", "SERVICE_BACKEND_PROTOTYPE"],
  ["Technical Audit", "SERVICE_TECH_AUDIT"],
  ["Technical Documentation", "SERVICE_TECH_DOCUMENTATION"],
  ["Other", "SERVICE_OTHER"]
]);

export function normalizeTallyPayload(payload) {
  if (payload?.eventType !== "FORM_RESPONSE") {
    throw new Error("UNSUPPORTED_EVENT_TYPE");
  }

  const fields = Array.isArray(payload?.data?.fields) ? payload.data.fields : [];

  const name = choiceText(fieldByLabel(fields, "Nom"))?.trim();
  const email = choiceText(fieldByLabel(fields, "Email"))?.trim().toLowerCase();
  const serviceLabel = choiceText(fieldByLabel(fields, "Service recherché"))?.trim();
  const problem = choiceText(fieldByLabel(fields, "Quel problème veux-tu résoudre ?"))?.trim();
  const deadline = choiceText(fieldByLabel(fields, "Échéance souhaitée"))?.trim() || null;
  const budgetRange = choiceText(fieldByLabel(fields, "Budget indicatif"))?.trim() || null;
  const consent = checkboxAccepted(fieldByLabel(fields, "Consentement"));
  const source = choiceText(fieldByLabel(fields, "source"))?.trim() || "unknown";

  if (!name || !email || !serviceLabel || !problem || !consent) {
    throw new Error("VALIDATION_ERROR");
  }

  return {
    provider: "tally",
    idempotencyKey: payload.eventId || payload.data?.submissionId || payload.data?.responseId,
    requestId: payload.eventId || payload.data?.submissionId || null,
    formId: payload.data?.formId || null,
    name,
    email,
    serviceCode: SERVICE_CODES.get(serviceLabel) ?? "SERVICE_OTHER",
    problemSummary: problem,
    budgetRange,
    deadline,
    source,
    consent
  };
}
