create table if not exists public.itinerary_documents (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('passport', 'flight', 'hotel', 'insurance', 'other')),
  title text not null,
  subtitle text,
  reference text,
  url text not null,
  expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_itinerary_documents_itinerary on public.itinerary_documents (itinerary_id);
create index if not exists idx_itinerary_documents_expiry on public.itinerary_documents (expiry_date);

alter table public.itinerary_documents enable row level security;

drop policy if exists "itinerary_documents_read" on public.itinerary_documents;
create policy "itinerary_documents_read" on public.itinerary_documents
  for select
  using (
    exists (
      select 1
      from public.itineraries
      where itineraries.id = itinerary_documents.itinerary_id
        and itineraries.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.itinerary_collaborators
      where itinerary_collaborators.itinerary_id = itinerary_documents.itinerary_id
        and itinerary_collaborators.user_id = auth.uid()
        and itinerary_collaborators.deleted_at is null
    )
  );

drop policy if exists "itinerary_documents_insert" on public.itinerary_documents;
create policy "itinerary_documents_insert" on public.itinerary_documents
  for insert
  with check (
    user_id = auth.uid()
    and (
      exists (
        select 1
        from public.itineraries
        where itineraries.id = itinerary_documents.itinerary_id
          and itineraries.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.itinerary_collaborators
        where itinerary_collaborators.itinerary_id = itinerary_documents.itinerary_id
          and itinerary_collaborators.user_id = auth.uid()
          and itinerary_collaborators.deleted_at is null
      )
    )
  );

drop policy if exists "itinerary_documents_update" on public.itinerary_documents;
create policy "itinerary_documents_update" on public.itinerary_documents
  for update
  using (
    exists (
      select 1
      from public.itineraries
      where itineraries.id = itinerary_documents.itinerary_id
        and itineraries.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.itinerary_collaborators
      where itinerary_collaborators.itinerary_id = itinerary_documents.itinerary_id
        and itinerary_collaborators.user_id = auth.uid()
        and itinerary_collaborators.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from public.itineraries
      where itineraries.id = itinerary_documents.itinerary_id
        and itineraries.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.itinerary_collaborators
      where itinerary_collaborators.itinerary_id = itinerary_documents.itinerary_id
        and itinerary_collaborators.user_id = auth.uid()
        and itinerary_collaborators.deleted_at is null
    )
  );

drop policy if exists "itinerary_documents_delete" on public.itinerary_documents;
create policy "itinerary_documents_delete" on public.itinerary_documents
  for delete
  using (
    exists (
      select 1
      from public.itineraries
      where itineraries.id = itinerary_documents.itinerary_id
        and itineraries.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.itinerary_collaborators
      where itinerary_collaborators.itinerary_id = itinerary_documents.itinerary_id
        and itinerary_collaborators.user_id = auth.uid()
        and itinerary_collaborators.deleted_at is null
    )
  );
