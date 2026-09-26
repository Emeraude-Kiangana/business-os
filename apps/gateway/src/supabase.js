export async function ingestLead(env, lead) {
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("CONFIGURATION_ERROR");
  }

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/rpc/ingest_lead`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        p_provider: lead.provider,
        p_idempotency_key: lead.idempotencyKey,
        p_name: lead.name,
        p_email: lead.email,
        p_service_code: lead.serviceCode,
        p_problem_summary: lead.problemSummary,
        p_budget_range: lead.budgetRange,
        p_deadline: lead.deadline,
        p_source: lead.source,
        p_consent: lead.consent,
        p_request_id: lead.requestId
      })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DATABASE_ERROR:${response.status}:${body.slice(0, 300)}`);
  }

  return response.json();
}
