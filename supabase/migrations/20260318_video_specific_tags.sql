create table if not exists public.video_filter_tags (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (itinerary_id, slug)
);

create index if not exists video_filter_tags_itinerary_id_idx on public.video_filter_tags (itinerary_id);

create table if not exists public.social_video_tag_links (
  video_id uuid not null references public.social_videos(id) on delete cascade,
  tag_id uuid not null references public.video_filter_tags(id) on delete cascade,
  primary key (video_id, tag_id)
);

create index if not exists social_video_tag_links_tag_id_idx on public.social_video_tag_links (tag_id);

alter table public.video_filter_tags enable row level security;
alter table public.social_video_tag_links enable row level security;

drop policy if exists "video_filter_tags_read" on public.video_filter_tags;
create policy "video_filter_tags_read" on public.video_filter_tags
  for select
  using (has_itinerary_access(itinerary_id));

drop policy if exists "video_filter_tags_insert" on public.video_filter_tags;
create policy "video_filter_tags_insert" on public.video_filter_tags
  for insert
  with check (has_itinerary_write_access(itinerary_id));

drop policy if exists "video_filter_tags_update" on public.video_filter_tags;
create policy "video_filter_tags_update" on public.video_filter_tags
  for update
  using (has_itinerary_write_access(itinerary_id))
  with check (has_itinerary_write_access(itinerary_id));

drop policy if exists "video_filter_tags_delete" on public.video_filter_tags;
create policy "video_filter_tags_delete" on public.video_filter_tags
  for delete
  using (has_itinerary_write_access(itinerary_id));

drop policy if exists "social_video_tag_links_read" on public.social_video_tag_links;
create policy "social_video_tag_links_read" on public.social_video_tag_links
  for select
  using (
    exists (
      select 1
      from public.social_videos
      where social_videos.id = social_video_tag_links.video_id
        and has_itinerary_access(social_videos.itinerary_id)
    )
  );

drop policy if exists "social_video_tag_links_insert" on public.social_video_tag_links;
create policy "social_video_tag_links_insert" on public.social_video_tag_links
  for insert
  with check (
    exists (
      select 1
      from public.social_videos
      where social_videos.id = social_video_tag_links.video_id
        and has_itinerary_write_access(social_videos.itinerary_id)
    )
  );

drop policy if exists "social_video_tag_links_delete" on public.social_video_tag_links;
create policy "social_video_tag_links_delete" on public.social_video_tag_links
  for delete
  using (
    exists (
      select 1
      from public.social_videos
      where social_videos.id = social_video_tag_links.video_id
        and has_itinerary_write_access(social_videos.itinerary_id)
    )
  );

insert into public.video_filter_tags (itinerary_id, name, slug)
select distinct
  sv.itinerary_id,
  trim(t.name) as name,
  case
    when nullif(trim(t.slug), '') is not null and length(trim(t.slug)) > 1 then lower(trim(t.slug))
    else trim(both '-' from lower(regexp_replace(trim(t.name), '[^a-zA-Z0-9]+', '-', 'g')))
  end as slug
from public.video_tags vt
join public.social_videos sv on sv.id = vt.video_id
join public.tags t on t.id = vt.tag_id
where sv.deleted_at is null
on conflict (itinerary_id, slug) do update
set name = excluded.name,
    updated_at = now();

insert into public.social_video_tag_links (video_id, tag_id)
select distinct
  vt.video_id,
  vft.id
from public.video_tags vt
join public.social_videos sv on sv.id = vt.video_id
join public.tags t on t.id = vt.tag_id
join public.video_filter_tags vft
  on vft.itinerary_id = sv.itinerary_id
 and vft.slug = case
   when nullif(trim(t.slug), '') is not null and length(trim(t.slug)) > 1 then lower(trim(t.slug))
   else trim(both '-' from lower(regexp_replace(trim(t.name), '[^a-zA-Z0-9]+', '-', 'g')))
 end
where sv.deleted_at is null
on conflict do nothing;