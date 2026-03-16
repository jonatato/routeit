do $$
declare
  table_name text;
begin
  for table_name in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename ~ '^backup_.*_20260306$'
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;
