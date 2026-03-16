create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  row_id text,
  itinerary_id uuid,
  actor_user_id uuid,
  actor_claim_sub text,
  actor_role text,
  changed_columns text[] not null default '{}'::text[],
  old_data jsonb,
  new_data jsonb,
  txid bigint not null default txid_current(),
  app_name text default current_setting('application_name', true),
  client_addr inet default inet_client_addr()
);

create index if not exists idx_audit_log_occurred_at on public.audit_log (occurred_at desc);
create index if not exists idx_audit_log_table_operation on public.audit_log (table_name, operation, occurred_at desc);
create index if not exists idx_audit_log_itinerary on public.audit_log (itinerary_id, occurred_at desc);

revoke all on public.audit_log from anon, authenticated;

-- Optional read access for server-side debugging via service_role only.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select on public.audit_log to service_role;
  end if;
end;
$$;

create or replace function public.audit_capture_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_sub text;
  v_actor_user_id uuid;
  v_actor_role text;
  v_itinerary_id uuid;
  v_row_id text;
  v_old jsonb;
  v_new jsonb;
  v_changed text[];
begin
  v_actor_sub := nullif(current_setting('request.jwt.claim.sub', true), '');
  v_actor_role := nullif(current_setting('request.jwt.claim.role', true), '');

  if v_actor_sub is not null
     and v_actor_sub ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    v_actor_user_id := v_actor_sub::uuid;
  end if;

  if TG_OP = 'INSERT' then
    v_new := to_jsonb(NEW);
    v_old := null;
    v_row_id := v_new->>'id';
  elsif TG_OP = 'UPDATE' then
    v_new := to_jsonb(NEW);
    v_old := to_jsonb(OLD);
    v_row_id := coalesce(v_new->>'id', v_old->>'id');

    select coalesce(array_agg(n.key order by n.key), '{}'::text[])
      into v_changed
    from jsonb_each(v_new) n
    left join jsonb_each(v_old) o on o.key = n.key
    where n.value is distinct from o.value;
  else
    v_new := null;
    v_old := to_jsonb(OLD);
    v_row_id := v_old->>'id';
  end if;

  if TG_TABLE_NAME = 'itineraries' then
    v_itinerary_id := coalesce((v_new->>'id')::uuid, (v_old->>'id')::uuid);
  elsif TG_TABLE_NAME = 'days' then
    v_itinerary_id := coalesce((v_new->>'itinerary_id')::uuid, (v_old->>'itinerary_id')::uuid);
  elsif TG_TABLE_NAME = 'schedule_items' then
    select d.itinerary_id
      into v_itinerary_id
    from public.days d
    where d.id = coalesce((v_new->>'day_id')::uuid, (v_old->>'day_id')::uuid);
  end if;

  insert into public.audit_log (
    table_name,
    operation,
    row_id,
    itinerary_id,
    actor_user_id,
    actor_claim_sub,
    actor_role,
    changed_columns,
    old_data,
    new_data
  )
  values (
    TG_TABLE_NAME,
    TG_OP,
    v_row_id,
    v_itinerary_id,
    v_actor_user_id,
    v_actor_sub,
    v_actor_role,
    coalesce(v_changed, '{}'::text[]),
    v_old,
    v_new
  );

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_audit_itineraries on public.itineraries;
create trigger trg_audit_itineraries
after insert or update or delete on public.itineraries
for each row execute function public.audit_capture_row();

drop trigger if exists trg_audit_days on public.days;
create trigger trg_audit_days
after insert or update or delete on public.days
for each row execute function public.audit_capture_row();

drop trigger if exists trg_audit_schedule_items on public.schedule_items;
create trigger trg_audit_schedule_items
after insert or update or delete on public.schedule_items
for each row execute function public.audit_capture_row();
