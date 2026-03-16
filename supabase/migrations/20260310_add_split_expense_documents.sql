create table if not exists public.split_expense_documents (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.split_expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('receipt', 'invoice', 'ticket', 'other')),
  title text not null,
  subtitle text,
  reference text,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint split_expense_documents_non_empty_url check (length(trim(url)) > 0)
);

create index if not exists idx_split_expense_documents_expense on public.split_expense_documents (expense_id);
create index if not exists idx_split_expense_documents_created_at on public.split_expense_documents (created_at desc);

alter table public.split_expense_documents enable row level security;

drop policy if exists "split_expense_documents_read" on public.split_expense_documents;
create policy "split_expense_documents_read" on public.split_expense_documents
  for select
  using (
    exists (
      select 1
      from public.split_expenses
      join public.split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_documents.expense_id
        and split_expenses.deleted_at is null
        and split_groups.deleted_at is null
        and (
          exists (
            select 1
            from public.itineraries
            where itineraries.id = split_groups.itinerary_id
              and itineraries.user_id = auth.uid()
              and itineraries.deleted_at is null
          )
          or exists (
            select 1
            from public.itinerary_collaborators
            where itinerary_collaborators.itinerary_id = split_groups.itinerary_id
              and itinerary_collaborators.user_id = auth.uid()
              and itinerary_collaborators.deleted_at is null
          )
        )
    )
  );

drop policy if exists "split_expense_documents_insert" on public.split_expense_documents;
create policy "split_expense_documents_insert" on public.split_expense_documents
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.split_expenses
      join public.split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_documents.expense_id
        and split_expenses.deleted_at is null
        and split_groups.deleted_at is null
        and (
          exists (
            select 1
            from public.itineraries
            where itineraries.id = split_groups.itinerary_id
              and itineraries.user_id = auth.uid()
              and itineraries.deleted_at is null
          )
          or exists (
            select 1
            from public.itinerary_collaborators
            where itinerary_collaborators.itinerary_id = split_groups.itinerary_id
              and itinerary_collaborators.user_id = auth.uid()
              and itinerary_collaborators.deleted_at is null
          )
        )
    )
  );

drop policy if exists "split_expense_documents_update" on public.split_expense_documents;
create policy "split_expense_documents_update" on public.split_expense_documents
  for update
  using (
    exists (
      select 1
      from public.split_expenses
      join public.split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_documents.expense_id
        and split_expenses.deleted_at is null
        and split_groups.deleted_at is null
        and (
          exists (
            select 1
            from public.itineraries
            where itineraries.id = split_groups.itinerary_id
              and itineraries.user_id = auth.uid()
              and itineraries.deleted_at is null
          )
          or exists (
            select 1
            from public.itinerary_collaborators
            where itinerary_collaborators.itinerary_id = split_groups.itinerary_id
              and itinerary_collaborators.user_id = auth.uid()
              and itinerary_collaborators.deleted_at is null
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.split_expenses
      join public.split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_documents.expense_id
        and split_expenses.deleted_at is null
        and split_groups.deleted_at is null
        and (
          exists (
            select 1
            from public.itineraries
            where itineraries.id = split_groups.itinerary_id
              and itineraries.user_id = auth.uid()
              and itineraries.deleted_at is null
          )
          or exists (
            select 1
            from public.itinerary_collaborators
            where itinerary_collaborators.itinerary_id = split_groups.itinerary_id
              and itinerary_collaborators.user_id = auth.uid()
              and itinerary_collaborators.deleted_at is null
          )
        )
    )
  );

drop policy if exists "split_expense_documents_delete" on public.split_expense_documents;
create policy "split_expense_documents_delete" on public.split_expense_documents
  for delete
  using (
    exists (
      select 1
      from public.split_expenses
      join public.split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_documents.expense_id
        and split_expenses.deleted_at is null
        and split_groups.deleted_at is null
        and (
          exists (
            select 1
            from public.itineraries
            where itineraries.id = split_groups.itinerary_id
              and itineraries.user_id = auth.uid()
              and itineraries.deleted_at is null
          )
          or exists (
            select 1
            from public.itinerary_collaborators
            where itinerary_collaborators.itinerary_id = split_groups.itinerary_id
              and itinerary_collaborators.user_id = auth.uid()
              and itinerary_collaborators.deleted_at is null
          )
        )
    )
  );
