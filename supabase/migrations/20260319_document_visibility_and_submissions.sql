create or replace function public.is_itinerary_member(itinerary_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.itineraries i
    where i.id = itinerary_uuid
      and i.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.itinerary_collaborators ic
    where ic.itinerary_id = itinerary_uuid
      and ic.user_id = auth.uid()
      and ic.deleted_at is null
  );
$$;

alter table public.itinerary_documents
  add column if not exists visibility text not null default 'public';

alter table public.itinerary_documents
  drop constraint if exists itinerary_documents_visibility_check;

alter table public.itinerary_documents
  add constraint itinerary_documents_visibility_check
  check (visibility in ('public', 'private'));

alter table public.itinerary_documents
  drop constraint if exists itinerary_documents_type_check;

alter table public.itinerary_documents
  add constraint itinerary_documents_type_check
  check (type in ('passport', 'flight', 'hotel', 'insurance', 'ground_transport', 'car_rental', 'other'));

create index if not exists idx_itinerary_documents_visibility
  on public.itinerary_documents (itinerary_id, visibility, created_at desc);

create table if not exists public.itinerary_document_submissions (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  reviewed_by uuid references auth.users(id) on delete set null,
  approved_document_id uuid references public.itinerary_documents(id) on delete set null,
  type text not null,
  title text not null,
  subtitle text,
  reference text,
  url text not null,
  expiry_date date,
  target_visibility text not null default 'public',
  status text not null default 'pending',
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  deleted_at timestamptz,
  constraint itinerary_document_submissions_type_check
    check (type in ('passport', 'flight', 'hotel', 'insurance', 'ground_transport', 'car_rental', 'other')),
  constraint itinerary_document_submissions_target_visibility_check
    check (target_visibility = 'public'),
  constraint itinerary_document_submissions_status_check
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  constraint itinerary_document_submissions_non_empty_url check (length(trim(url)) > 0)
);

create index if not exists idx_itinerary_document_submissions_itinerary
  on public.itinerary_document_submissions (itinerary_id, status, created_at desc);

create index if not exists idx_itinerary_document_submissions_submitter
  on public.itinerary_document_submissions (submitted_by, created_at desc);

alter table public.itinerary_document_submissions enable row level security;

drop policy if exists "itinerary_documents_read" on public.itinerary_documents;
create policy "itinerary_documents_read" on public.itinerary_documents
  for select
  using (
    (visibility = 'private' and user_id = auth.uid())
    or (
      visibility = 'public'
      and public.is_itinerary_member(itinerary_id)
    )
  );

drop policy if exists "itinerary_documents_insert" on public.itinerary_documents;
create policy "itinerary_documents_insert" on public.itinerary_documents
  for insert
  with check (
    user_id = auth.uid()
    and public.is_itinerary_member(itinerary_id)
    and (
      visibility = 'private'
      or exists (
        select 1
        from public.itineraries i
        where i.id = itinerary_documents.itinerary_id
          and i.user_id = auth.uid()
      )
      or public.is_itinerary_editor(itinerary_id)
    )
  );

drop policy if exists "itinerary_documents_update" on public.itinerary_documents;
create policy "itinerary_documents_update" on public.itinerary_documents
  for update
  using (
    (visibility = 'private' and user_id = auth.uid())
    or (
      visibility = 'public'
      and (
        exists (
          select 1
          from public.itineraries i
          where i.id = itinerary_documents.itinerary_id
            and i.user_id = auth.uid()
        )
        or public.is_itinerary_editor(itinerary_id)
      )
    )
  )
  with check (
    (
      visibility = 'private'
      and user_id = auth.uid()
      and public.is_itinerary_member(itinerary_id)
    )
    or (
      visibility = 'public'
      and (
        exists (
          select 1
          from public.itineraries i
          where i.id = itinerary_documents.itinerary_id
            and i.user_id = auth.uid()
        )
        or public.is_itinerary_editor(itinerary_id)
      )
    )
  );

drop policy if exists "itinerary_documents_delete" on public.itinerary_documents;
create policy "itinerary_documents_delete" on public.itinerary_documents
  for delete
  using (
    (visibility = 'private' and user_id = auth.uid())
    or (
      visibility = 'public'
      and (
        exists (
          select 1
          from public.itineraries i
          where i.id = itinerary_documents.itinerary_id
            and i.user_id = auth.uid()
        )
        or public.is_itinerary_editor(itinerary_id)
      )
    )
  );

drop policy if exists "itinerary_document_submissions_read" on public.itinerary_document_submissions;
create policy "itinerary_document_submissions_read" on public.itinerary_document_submissions
  for select
  using (
    submitted_by = auth.uid()
    or exists (
      select 1
      from public.itineraries i
      where i.id = itinerary_document_submissions.itinerary_id
        and i.user_id = auth.uid()
    )
    or public.is_itinerary_editor(itinerary_id)
  );

drop policy if exists "itinerary_document_submissions_insert" on public.itinerary_document_submissions;
create policy "itinerary_document_submissions_insert" on public.itinerary_document_submissions
  for insert
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
    and target_visibility = 'public'
    and exists (
      select 1
      from public.itinerary_collaborators ic
      where ic.itinerary_id = itinerary_document_submissions.itinerary_id
        and ic.user_id = auth.uid()
        and ic.role = 'viewer'
        and ic.deleted_at is null
    )
  );

drop policy if exists "itinerary_document_submissions_update_submitter" on public.itinerary_document_submissions;
create policy "itinerary_document_submissions_update_submitter" on public.itinerary_document_submissions
  for update
  using (
    submitted_by = auth.uid()
    and status = 'pending'
  )
  with check (
    submitted_by = auth.uid()
    and status in ('pending', 'cancelled')
  );

drop policy if exists "itinerary_document_submissions_update_reviewers" on public.itinerary_document_submissions;
create policy "itinerary_document_submissions_update_reviewers" on public.itinerary_document_submissions
  for update
  using (
    exists (
      select 1
      from public.itineraries i
      where i.id = itinerary_document_submissions.itinerary_id
        and i.user_id = auth.uid()
    )
    or public.is_itinerary_editor(itinerary_id)
  )
  with check (
    exists (
      select 1
      from public.itineraries i
      where i.id = itinerary_document_submissions.itinerary_id
        and i.user_id = auth.uid()
    )
    or public.is_itinerary_editor(itinerary_id)
  );

create or replace function public.approve_itinerary_document_submission(submission_uuid uuid, note text default null)
returns public.itinerary_documents
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_record public.itinerary_document_submissions%rowtype;
  approved_document public.itinerary_documents%rowtype;
begin
  select *
  into submission_record
  from public.itinerary_document_submissions
  where id = submission_uuid
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Submission not found';
  end if;

  if submission_record.status <> 'pending' then
    raise exception 'Submission is not pending';
  end if;

  if not (
    exists (
      select 1
      from public.itineraries i
      where i.id = submission_record.itinerary_id
        and i.user_id = auth.uid()
    )
    or public.is_itinerary_editor(submission_record.itinerary_id)
  ) then
    raise exception 'Not authorized to approve this submission';
  end if;

  insert into public.itinerary_documents (
    itinerary_id,
    user_id,
    type,
    title,
    subtitle,
    reference,
    url,
    expiry_date,
    visibility
  )
  values (
    submission_record.itinerary_id,
    submission_record.submitted_by,
    submission_record.type,
    submission_record.title,
    submission_record.subtitle,
    submission_record.reference,
    submission_record.url,
    submission_record.expiry_date,
    'public'
  )
  returning * into approved_document;

  update public.itinerary_document_submissions
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = nullif(trim(note), ''),
      approved_document_id = approved_document.id,
      updated_at = now()
  where id = submission_record.id;

  return approved_document;
end;
$$;

grant execute on function public.approve_itinerary_document_submission(uuid, text) to authenticated;