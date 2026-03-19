begin;

drop policy if exists split_expense_documents_read on public.split_expense_documents;
drop policy if exists split_expense_documents_insert on public.split_expense_documents;
drop policy if exists split_expense_documents_update on public.split_expense_documents;
drop policy if exists split_expense_documents_delete on public.split_expense_documents;

create policy split_expense_documents_read_access
on public.split_expense_documents
for select
using (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_documents.expense_id
      and se.deleted_at is null
      and sg.deleted_at is null
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_expense_documents_insert_access
on public.split_expense_documents
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_documents.expense_id
      and se.deleted_at is null
      and sg.deleted_at is null
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

create policy split_expense_documents_update_access
on public.split_expense_documents
for update
using (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_documents.expense_id
      and se.deleted_at is null
      and sg.deleted_at is null
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_documents.expense_id
      and se.deleted_at is null
      and sg.deleted_at is null
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

create policy split_expense_documents_delete_access
on public.split_expense_documents
for delete
using (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_documents.expense_id
      and se.deleted_at is null
      and sg.deleted_at is null
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

commit;