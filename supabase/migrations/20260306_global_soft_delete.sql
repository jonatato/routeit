-- Global soft delete guardrail
-- 1) Ensure all public tables have deleted_at
-- 2) Convert DELETE into soft delete (set deleted_at = now())

create or replace function public.soft_delete_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_pk_cols text[];
  v_condition text;
begin
  -- If already soft-deleted, keep operation idempotent.
  if old.deleted_at is not null then
    return null;
  end if;

  v_old := to_jsonb(old);

  select array_agg(att.attname order by ord.ordinality)
    into v_pk_cols
  from pg_index idx
  join unnest(idx.indkey) with ordinality as ord(attnum, ordinality) on true
  join pg_attribute att
    on att.attrelid = idx.indrelid
   and att.attnum = ord.attnum
  where idx.indrelid = TG_RELID
    and idx.indisprimary;

  if coalesce(array_length(v_pk_cols, 1), 0) > 0 then
    select string_agg(
      format('(to_jsonb(t)->>%L) is not distinct from ($1->>%L)', col, col),
      ' and '
    )
      into v_condition
    from unnest(v_pk_cols) as col;
  else
    -- Fallback for tables without primary key.
    v_condition := 'to_jsonb(t) = $1';
  end if;

  execute format(
    'update %I.%I t set deleted_at = now() where t.deleted_at is null and (%s)',
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    v_condition
  ) using v_old;

  -- Cancel physical delete.
  return null;
end;
$$;

do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', r.tablename);

    execute format('drop trigger if exists trg_soft_delete_guard on public.%I', r.tablename);
    execute format(
      'create trigger trg_soft_delete_guard before delete on public.%I for each row execute function public.soft_delete_row()',
      r.tablename
    );
  end loop;
end;
$$;
