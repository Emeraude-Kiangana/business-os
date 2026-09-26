create or replace function public.ingest_lead(
  p_provider text,
  p_idempotency_key text,
  p_name text,
  p_email text,
  p_service_code text,
  p_problem_summary text,
  p_budget_range text,
  p_deadline text,
  p_source text,
  p_consent boolean,
  p_request_id text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_idem_id uuid;
  v_contact_id uuid;
  v_lead_id uuid;
  v_response jsonb;
begin
  if p_provider is null or btrim(p_provider) = '' then
    raise exception 'provider required';
  end if;

  if p_idempotency_key is null or btrim(p_idempotency_key) = '' then
    raise exception 'idempotency key required';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'name required';
  end if;

  if p_email is null or btrim(p_email) = '' then
    raise exception 'email required';
  end if;

  if p_service_code is null or btrim(p_service_code) = '' then
    raise exception 'service code required';
  end if;

  if p_problem_summary is null or btrim(p_problem_summary) = '' then
    raise exception 'problem summary required';
  end if;

  if p_source is null or btrim(p_source) = '' then
    raise exception 'source required';
  end if;

  if p_consent is distinct from true then
    raise exception 'consent required';
  end if;

  insert into public.idempotency_keys (
    provider,
    idempotency_key
  )
  values (
    btrim(p_provider),
    btrim(p_idempotency_key)
  )
  on conflict do nothing
  returning id into v_idem_id;

  if v_idem_id is null then
    select response
      into v_response
      from public.idempotency_keys
     where provider = btrim(p_provider)
       and idempotency_key = btrim(p_idempotency_key)
     limit 1;

    return coalesce(
      v_response,
      jsonb_build_object(
        'ok', false,
        'code', 'IDEMPOTENCY_REPLAY_PENDING'
      )
    );
  end if;

  insert into public.contacts (
    name,
    email,
    source
  )
  values (
    btrim(p_name),
    lower(btrim(p_email)),
    btrim(p_source)
  )
  on conflict do nothing
  returning id into v_contact_id;

  if v_contact_id is null then
    select id
      into v_contact_id
      from public.contacts
     where lower(email) = lower(btrim(p_email))
     limit 1;

    update public.contacts
       set name = btrim(p_name),
           updated_at = now()
     where id = v_contact_id;
  end if;

  insert into public.leads (
    contact_id,
    service_code,
    problem_summary,
    budget_range,
    deadline,
    source,
    status
  )
  values (
    v_contact_id,
    btrim(p_service_code),
    btrim(p_problem_summary),
    nullif(btrim(coalesce(p_budget_range, '')), ''),
    nullif(btrim(coalesce(p_deadline, '')), ''),
    btrim(p_source),
    'NEW'
  )
  returning id into v_lead_id;

  insert into public.consents (
    contact_id,
    purpose,
    granted,
    source
  )
  values (
    v_contact_id,
    'CONTACT_REQUEST',
    true,
    btrim(p_source)
  );

  insert into public.lead_events (
    lead_id,
    event_type,
    source,
    request_id,
    metadata
  )
  values (
    v_lead_id,
    'lead.created',
    btrim(p_source),
    nullif(btrim(coalesce(p_request_id, '')), ''),
    jsonb_build_object(
      'provider', btrim(p_provider),
      'idempotency_key', btrim(p_idempotency_key)
    )
  );

  v_response := jsonb_build_object(
    'ok', true,
    'contact_id', v_contact_id,
    'lead_id', v_lead_id,
    'status', 'NEW'
  );

  update public.idempotency_keys
     set response = v_response
   where id = v_idem_id;

  return v_response;
end;
$$;

revoke execute on function public.ingest_lead(
  text, text, text, text, text, text, text, text, text, boolean, text
) from public, anon, authenticated;

grant execute on function public.ingest_lead(
  text, text, text, text, text, text, text, text, text, boolean, text
) to service_role;
