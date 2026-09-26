const textEncoder = new TextEncoder();

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_PROBLEM = 4000;
const MAX_SOURCE = 64;
const MAX_ATTRIBUTION = 256;

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

const ALLOWED_SOURCES = new Set([
  "portfolio",
  "github",
  "x",
  "direct",
  "referral",
  "outreach",
  "search",
  "unknown",
  "ci-test"
]);

const ALLOWED_BUDGETS = new Set([
  "À définir",
  "Moins de 50 USD",
  "50–150 USD",
  "150–500 USD",
  "500 USD+"
]);

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

  return value?.text ?? value?.label ?? value?.name ?? null;
}

function checkboxAccepted(field) {
  if (!field) return false;
  if (Array.isArray(field.value)) return field.value.length > 0;
  return field.value === true || field.value === "true";
}

function bounded(value, max) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized.slice(0, max);
}

function normalizeSource(value) {
  const candidate = bounded(value, MAX_SOURCE)?.toLowerCase() || "unknown";
  return ALLOWED_SOURCES.has(candidate) ? candidate : "unknown";
}

function validEmail(value) {
  if (!value || value.length > MAX_EMAIL) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validDate(value) {
  return value == null || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeTallyPayload(payload) {
  if (payload?.eventType !== "FORM_RESPONSE") {
    throw new Error("UNSUPPORTED_EVENT_TYPE");
  }

  const fields = Array.isArray(payload?.data?.fields) ? payload.data.fields : [];

  const name = bounded(choiceText(fieldByLabel(fields, "Nom")), MAX_NAME);
  const email = bounded(choiceText(fieldByLabel(fields, "Email")), MAX_EMAIL)?.toLowerCase();
  const serviceLabel = bounded(choiceText(fieldByLabel(fields, "Service recherché")), 120);
  const problem = bounded(
    choiceText(fieldByLabel(fields, "Quel problème veux-tu résoudre ?")),
    MAX_PROBLEM
  );
  const deadline = bounded(choiceText(fieldByLabel(fields, "Échéance souhaitée")), 10) || null;
  const budgetRaw = bounded(choiceText(fieldByLabel(fields, "Budget indicatif")), 64);
  const consent = checkboxAccepted(fieldByLabel(fields, "Consentement"));
  const source = normalizeSource(choiceText(fieldByLabel(fields, "source")));
  const serviceCode = SERVICE_CODES.get(serviceLabel);
  const budgetRange = budgetRaw && ALLOWED_BUDGETS.has(budgetRaw) ? budgetRaw : null;

  if (
    !name ||
    name.length > MAX_NAME ||
    !validEmail(email) ||
    !serviceCode ||
    !problem ||
    problem.length < 10 ||
    !validDate(deadline) ||
    !consent
  ) {
    throw new Error("VALIDATION_ERROR");
  }

  return {
    provider: "tally",
    idempotencyKey:
      bounded(payload.eventId, 128) ||
      bounded(payload.data?.submissionId, 128) ||
      bounded(payload.data?.responseId, 128),
    requestId:
      bounded(payload.eventId, 128) ||
      bounded(payload.data?.submissionId, 128) ||
      null,
    formId: bounded(payload.data?.formId, 64),
    name,
    email,
    serviceCode,
    problemSummary: problem,
    budgetRange,
    deadline,
    source,
    consent,
    attribution: {
      utm_source: bounded(choiceText(fieldByLabel(fields, "utm_source")), MAX_ATTRIBUTION),
      utm_medium: bounded(choiceText(fieldByLabel(fields, "utm_medium")), MAX_ATTRIBUTION),
      utm_campaign: bounded(choiceText(fieldByLabel(fields, "utm_campaign")), MAX_ATTRIBUTION)
    }
  };
}
