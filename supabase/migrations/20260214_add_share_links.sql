create table if not exists itinerary_collaborators (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  user_id uuid not null,
  user_email text,
  role text not null check (role in ('owner','editor','viewer')),
  created_at timestamp with time zone default now(),
  unique (itinerary_id, user_id)
);

create table if not exists itinerary_share_links (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  token text not null unique,
  role text not null check (role in ('owner','editor','viewer')),
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table itinerary_collaborators enable row level security;
alter table itinerary_share_links enable row level security;

drop policy if exists "itinerary_collaborators_read" on itinerary_collaborators;
drop policy if exists "itinerary_collaborators_write" on itinerary_collaborators;

drop policy if exists "itinerary_share_links_owner" on itinerary_share_links;

create policy "itinerary_collaborators_read" on itinerary_collaborators
  for select
  using (
    user_id = auth.uid()
    or exists (select 1 from itineraries where itineraries.id = itinerary_collaborators.itinerary_id and itineraries.user_id = auth.uid())
  );

create policy "itinerary_collaborators_write" on itinerary_collaborators
  for all
  using (
    exists (select 1 from itineraries where itineraries.id = itinerary_collaborators.itinerary_id and itineraries.user_id = auth.uid())
  )
  with check (
    exists (select 1 from itineraries where itineraries.id = itinerary_collaborators.itinerary_id and itineraries.user_id = auth.uid())
  );

create policy "itinerary_share_links_owner" on itinerary_share_links
  for all
  using (
    exists (select 1 from itineraries where itineraries.id = itinerary_share_links.itinerary_id and itineraries.user_id = auth.uid())
  )
  with check (
    exists (select 1 from itineraries where itineraries.id = itinerary_share_links.itinerary_id and itineraries.user_id = auth.uid())
  );

create or replace function accept_share_link(token_text text)
returns table (itinerary_id uuid, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email_val text;
begin
  -- Get current user email
  select email into user_email_val
  from auth.users
  where id = auth.uid();

  return query
  with link as (
    select * from itinerary_share_links
    where token = token_text
      and (expires_at is null or expires_at > now())
    limit 1
  ),
  inserted as (
    insert into itinerary_collaborators (itinerary_id, user_id, user_email, role)
    select link.itinerary_id, auth.uid(), user_email_val, link.role
    from link
    on conflict (itinerary_id, user_id) do update set role = excluded.role, user_email = user_email_val
    returning itinerary_id, role
  )
  select itinerary_id, role from inserted;
end;
$$;

revoke all on function accept_share_link(text) from public;
grant execute on function accept_share_link(text) to authenticated;
