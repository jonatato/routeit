-- Fix global soft delete implementation.
-- Replace DELETE trigger strategy with DELETE rewrite rules:
-- DELETE => UPDATE ... SET deleted_at = now()

do $$
declare
  r record;
  v_pk_cols text[];
  v_condition text;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    -- Ensure column exists.
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', r.tablename);

    -- Remove previous trigger-based guard (if present).
    execute format('drop trigger if exists trg_soft_delete_guard on public.%I', r.tablename);

    -- Build WHERE for rewrite rule using PK columns when available.
    select array_agg(att.attname order by ord.ordinality)
      into v_pk_cols
    from pg_index idx
    join unnest(idx.indkey) with ordinality as ord(attnum, ordinality) on true
    join pg_attribute att
      on att.attrelid = idx.indrelid
     and att.attnum = ord.attnum
    where idx.indrelid = format('public.%I', r.tablename)::regclass
      and idx.indisprimary;

    if coalesce(array_length(v_pk_cols, 1), 0) > 0 then
      select string_agg(
        format('%I is not distinct from OLD.%I', col, col),
        ' and '
      )
        into v_condition
      from unnest(v_pk_cols) as col;
    else
      -- Fallback for tables without primary key.
      v_condition := 'ctid = OLD.ctid';
    end if;

    execute format('drop rule if exists soft_deletion_rule on public.%I', r.tablename);
    execute format(
      'create rule soft_deletion_rule as on delete to public.%I do instead update public.%I set deleted_at = now() where deleted_at is null and (%s) returning *',
      r.tablename,
      r.tablename,
      v_condition
    );
  end loop;
end;
$$;
