create extension if not exists "pgcrypto";

create table if not exists itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  date_range text not null,
  intro text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

create table if not exists days (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  order_index integer not null,
  day_label text not null,
  date_text text not null,
  city text not null,
  plan text not null,
  kind text not null
);

create table if not exists schedule_items (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references days(id) on delete cascade,
  time text not null,
  activity text not null,
  link text,
  map_link text,
  lat double precision,
  lng double precision,
  order_index integer not null
);

create table if not exists day_notes (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references days(id) on delete cascade,
  note text not null,
  order_index integer not null
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  name text not null,
  slug text not null
);

create table if not exists day_tags (
  day_id uuid not null references days(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (day_id, tag_id)
);

create table if not exists schedule_item_tags (
  schedule_item_id uuid not null references schedule_items(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (schedule_item_id, tag_id)
);

-- Private space & sharing
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

create table if not exists bag_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  order_index integer not null,
  created_at timestamp with time zone default now()
);

create table if not exists bag_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references bag_categories(id) on delete cascade,
  text text not null,
  checked boolean default false,
  order_index integer not null,
  created_at timestamp with time zone default now()
);

create table if not exists split_groups (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  currency text not null default 'EUR',
  created_at timestamp with time zone default now()
);

create table if not exists split_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references split_groups(id) on delete cascade,
  user_id uuid,
  name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists split_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references split_groups(id) on delete cascade,
  payer_id uuid not null references split_members(id) on delete cascade,
  amount numeric not null,
  title text not null,
  division_type text default 'equal' check (division_type in ('equal', 'percentage', 'exact', 'shares')),
  expense_date date,
  category_id uuid,
  receipt_url text,
  created_at timestamp with time zone default now()
);

create table if not exists split_shares (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references split_expenses(id) on delete cascade,
  member_id uuid not null references split_members(id) on delete cascade,
  amount numeric not null
);

create table if not exists split_payments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references split_groups(id) on delete cascade,
  payer_id uuid not null references split_members(id) on delete cascade,
  payee_id uuid not null references split_members(id) on delete cascade,
  amount numeric not null,
  note text,
  created_at timestamp with time zone default now()
);

create table if not exists split_expense_categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references split_groups(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  created_at timestamp with time zone default now()
);

create table if not exists split_expense_comments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references split_expenses(id) on delete cascade,
  member_id uuid not null references split_members(id) on delete cascade,
  comment text not null,
  created_at timestamp with time zone default now()
);

create table if not exists split_tags (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references split_groups(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamp with time zone default now()
);

create table if not exists split_expense_tags (
  expense_id uuid not null references split_expenses(id) on delete cascade,
  tag_id uuid not null references split_tags(id) on delete cascade,
  primary key (expense_id, tag_id)
);

create table if not exists split_notifications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references split_groups(id) on delete cascade,
  member_id uuid not null references split_members(id) on delete cascade,
  type text not null check (type in ('expense_added', 'payment_received', 'comment_added', 'member_added')),
  expense_id uuid references split_expenses(id) on delete cascade,
  payment_id uuid references split_payments(id) on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists split_payment_reminders (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references split_groups(id) on delete cascade,
  payer_id uuid not null references split_members(id) on delete cascade,
  payee_id uuid not null references split_members(id) on delete cascade,
  amount numeric not null,
  reminder_date date not null,
  note text,
  sent boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists split_refunds (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references split_groups(id) on delete cascade,
  expense_id uuid not null references split_expenses(id) on delete cascade,
  payer_id uuid not null references split_members(id) on delete cascade,
  payee_id uuid not null references split_members(id) on delete cascade,
  amount numeric not null,
  note text,
  created_at timestamp with time zone default now()
);

create table if not exists itinerary_section_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_key text not null,
  section_label text not null,
  order_index integer not null,
  is_visible boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, section_key)
);

alter table itinerary_collaborators enable row level security;
alter table itinerary_share_links enable row level security;
alter table bag_categories enable row level security;
alter table bag_items enable row level security;
alter table split_groups enable row level security;
alter table split_members enable row level security;
alter table split_expenses enable row level security;
alter table split_shares enable row level security;
alter table split_payments enable row level security;
alter table split_expense_categories enable row level security;
alter table split_expense_comments enable row level security;
alter table split_tags enable row level security;
alter table split_expense_tags enable row level security;
alter table split_notifications enable row level security;
alter table split_payment_reminders enable row level security;
alter table split_refunds enable row level security;
alter table itinerary_section_preferences enable row level security;

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

create policy "bag_categories_owner" on bag_categories
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "bag_items_owner" on bag_items
  for all
  using (exists (select 1 from bag_categories where bag_categories.id = bag_items.category_id and bag_categories.user_id = auth.uid()))
  with check (exists (select 1 from bag_categories where bag_categories.id = bag_items.category_id and bag_categories.user_id = auth.uid()));

create policy "split_groups_access" on split_groups
  for all
  using (
    exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
    or exists (
      select 1 from itinerary_collaborators
      where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid()
    )
  )
  with check (
    exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
    or exists (
      select 1 from itinerary_collaborators
      where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid()
    )
  );

create policy "split_members_access" on split_members
  for all
  using (
    exists (select 1 from split_groups where split_groups.id = split_members.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  )
  with check (
    exists (select 1 from split_groups where split_groups.id = split_members.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  );

create policy "split_expenses_access" on split_expenses
  for all
  using (
    exists (select 1 from split_groups where split_groups.id = split_expenses.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  )
  with check (
    exists (select 1 from split_groups where split_groups.id = split_expenses.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  );

create policy "split_shares_access" on split_shares
  for all
  using (
    exists (select 1 from split_expenses
      join split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_shares.expense_id
        and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
          or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
        )
    )
  )
  with check (
    exists (select 1 from split_expenses
      join split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_shares.expense_id
        and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
          or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
        )
    )
  );

create policy "split_payments_access" on split_payments
  for all
  using (
    exists (select 1 from split_groups where split_groups.id = split_payments.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  )
  with check (
    exists (select 1 from split_groups where split_groups.id = split_payments.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  );

create policy "split_expense_categories_access" on split_expense_categories
  for all
  using (
    exists (select 1 from split_groups where split_groups.id = split_expense_categories.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  )
  with check (
    exists (select 1 from split_groups where split_groups.id = split_expense_categories.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  );

create policy "split_expense_comments_access" on split_expense_comments
  for all
  using (
    exists (select 1 from split_expenses
      join split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_comments.expense_id
        and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
          or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
        )
    )
  )
  with check (
    exists (select 1 from split_expenses
      join split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_comments.expense_id
        and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
          or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
        )
    )
  );

create policy "split_tags_access" on split_tags
  for all
  using (
    exists (select 1 from split_groups where split_groups.id = split_tags.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  )
  with check (
    exists (select 1 from split_groups where split_groups.id = split_tags.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  );

create policy "split_expense_tags_access" on split_expense_tags
  for all
  using (
    exists (select 1 from split_expenses
      join split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_tags.expense_id
        and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
          or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
        )
    )
  )
  with check (
    exists (select 1 from split_expenses
      join split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_tags.expense_id
        and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
          or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
        )
    )
  );

create policy "split_notifications_access" on split_notifications
  for all
  using (
    exists (select 1 from split_groups where split_groups.id = split_notifications.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
    and split_notifications.member_id in (
      select id from split_members where user_id = auth.uid()
    )
  )
  with check (
    exists (select 1 from split_groups where split_groups.id = split_notifications.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  );

create policy "split_payment_reminders_access" on split_payment_reminders
  for all
  using (
    exists (select 1 from split_groups where split_groups.id = split_payment_reminders.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  )
  with check (
    exists (select 1 from split_groups where split_groups.id = split_payment_reminders.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  );

create policy "split_refunds_access" on split_refunds
  for all
  using (
    exists (select 1 from split_groups where split_groups.id = split_refunds.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  )
  with check (
    exists (select 1 from split_groups where split_groups.id = split_refunds.group_id
      and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
        or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
      )
    )
  );

create policy "itinerary_section_preferences_owner" on itinerary_section_preferences
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- User widget preferences (persist user custom order/visibility per itinerary)
create table if not exists user_widget_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  itinerary_id uuid references itineraries(id) on delete cascade,
  widget_key text not null,
  order_index integer not null default 0,
  is_visible boolean not null default true,
  is_pinned boolean not null default false,
  is_collapsed boolean not null default false,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, itinerary_id, widget_key)
);

alter table user_widget_preferences enable row level security;

create policy "user_widget_preferences_owner" on user_widget_preferences
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function accept_share_link(token_text text)
returns table (itinerary_id uuid, role text)
language plpgsql
security definer
as $$
declare
  user_email_val text;
begin
  -- Obtener el email del usuario actual
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

create or replace function has_itinerary_access(itinerary_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from itineraries
    where id = itinerary_id and user_id = auth.uid()
  )
  or exists (
    select 1 from itinerary_collaborators
    where itinerary_id = has_itinerary_access.itinerary_id and user_id = auth.uid()
  );
$$;

create or replace function has_itinerary_write_access(itinerary_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from itineraries
    where id = itinerary_id and user_id = auth.uid()
  )
  or exists (
    select 1 from itinerary_collaborators
    where itinerary_id = has_itinerary_write_access.itinerary_id 
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$;

revoke all on function has_itinerary_access(uuid) from public;
grant execute on function has_itinerary_access(uuid) to authenticated;

create policy "itineraries_access" on itineraries
  for select
  using (has_itinerary_access(id) AND deleted_at IS NULL);

create policy "days_access" on days
  for select
  using (has_itinerary_access(itinerary_id));

create policy "schedule_items_access" on schedule_items
  for select
  using (
    exists (select 1 from days where days.id = schedule_items.day_id and has_itinerary_access(days.itinerary_id))
  );

create policy "day_notes_access" on day_notes
  for select
  using (
    exists (select 1 from days where days.id = day_notes.day_id and has_itinerary_access(days.itinerary_id))
  );

create policy "tags_access" on tags
  for select
  using (has_itinerary_access(itinerary_id));

create policy "day_tags_access" on day_tags
  for select
  using (
    exists (select 1 from days where days.id = day_tags.day_id and has_itinerary_access(days.itinerary_id))
  );

create policy "schedule_item_tags_access" on schedule_item_tags
  for select
  using (
    exists (select 1 from schedule_items
      join days on days.id = schedule_items.day_id
      where schedule_items.id = schedule_item_tags.schedule_item_id
        and has_itinerary_access(days.itinerary_id))
  );

create policy "locations_access" on locations
  for select
  using (has_itinerary_access(itinerary_id));

create policy "routes_access" on routes
  for select
  using (has_itinerary_access(itinerary_id));

create policy "flights_access" on flights
  for select
  using (has_itinerary_access(itinerary_id));

create policy "lists_access" on itinerary_lists
  for select
  using (has_itinerary_access(itinerary_id));

create policy "list_items_access" on itinerary_list_items
  for select
  using (
    exists (select 1 from itinerary_lists
      where itinerary_lists.id = itinerary_list_items.list_id
        and has_itinerary_access(itinerary_lists.itinerary_id))
  );

create policy "phrases_access" on phrases
  for select
  using (has_itinerary_access(itinerary_id));

create policy "budget_tiers_access" on budget_tiers
  for select
  using (has_itinerary_access(itinerary_id));

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  city text not null,
  label text not null,
  lat double precision not null,
  lng double precision not null,
  order_index integer not null
);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  city text not null,
  order_index integer not null
);

create table if not exists flights (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  direction text not null,
  date_text text not null,
  from_time text not null,
  to_time text not null,
  from_city text not null,
  to_city text not null,
  duration text not null,
  stops text not null
);

create table if not exists itinerary_lists (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  section_key text not null
);

create table if not exists itinerary_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references itinerary_lists(id) on delete cascade,
  text text not null,
  order_index integer not null
);

create table if not exists phrases (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  spanish text not null,
  pinyin text not null,
  chinese text not null,
  order_index integer not null
);

create table if not exists budget_tiers (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  label text not null,
  daily integer not null,
  tone text not null,
  order_index integer not null
);

create index if not exists days_itinerary_id_idx on days (itinerary_id);
create index if not exists schedule_items_day_id_idx on schedule_items (day_id);
create index if not exists day_notes_day_id_idx on day_notes (day_id);
create index if not exists schedule_item_tags_item_id_idx on schedule_item_tags (schedule_item_id);
create index if not exists tags_itinerary_id_idx on tags (itinerary_id);
create index if not exists locations_itinerary_id_idx on locations (itinerary_id);
create index if not exists routes_itinerary_id_idx on routes (itinerary_id);
create index if not exists flights_itinerary_id_idx on flights (itinerary_id);
create index if not exists itinerary_lists_itinerary_id_idx on itinerary_lists (itinerary_id);
create index if not exists itinerary_list_items_list_id_idx on itinerary_list_items (list_id);
create index if not exists phrases_itinerary_id_idx on phrases (itinerary_id);
create index if not exists budget_tiers_itinerary_id_idx on budget_tiers (itinerary_id);

alter table itineraries enable row level security;
alter table days enable row level security;
alter table schedule_items enable row level security;
alter table day_notes enable row level security;
alter table tags enable row level security;
alter table day_tags enable row level security;
alter table schedule_item_tags enable row level security;
alter table locations enable row level security;
alter table routes enable row level security;
alter table flights enable row level security;
alter table itinerary_lists enable row level security;
alter table itinerary_list_items enable row level security;
alter table phrases enable row level security;
alter table budget_tiers enable row level security;

-- Políticas de escritura para itineraries (las de lectura ya están arriba con itineraries_access)
create policy "itineraries_write" on itineraries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "days_read" on days
  for select using (
    exists (
      select 1 from itineraries
      where itineraries.id = days.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "days_write" on days
  for all using (
    has_itinerary_write_access(itinerary_id)
  ) with check (
    has_itinerary_write_access(itinerary_id)
  );

create policy "schedule_items_read" on schedule_items
  for select using (
    exists (
      select 1
      from days
      join itineraries on itineraries.id = days.itinerary_id
      where days.id = schedule_items.day_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "schedule_items_write" on schedule_items
  for all using (
    exists (
      select 1
      from days
      where days.id = schedule_items.day_id
        and has_itinerary_write_access(days.itinerary_id)
    )
  ) with check (
    exists (
      select 1
      from days
      where days.id = schedule_items.day_id
        and has_itinerary_write_access(days.itinerary_id)
    )
  );

create policy "day_notes_read" on day_notes
  for select using (
    exists (
      select 1
      from days
      join itineraries on itineraries.id = days.itinerary_id
      where days.id = day_notes.day_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "day_notes_write" on day_notes
  for all using (
    exists (
      select 1
      from days
      where days.id = day_notes.day_id
        and has_itinerary_write_access(days.itinerary_id)
    )
  ) with check (
    exists (
      select 1
      from days
      where days.id = day_notes.day_id
        and has_itinerary_write_access(days.itinerary_id)
    )
  );

create policy "tags_read" on tags
  for select using (
    exists (
      select 1 from itineraries
      where itineraries.id = tags.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "tags_write" on tags
  for all using (
    has_itinerary_write_access(itinerary_id)
  ) with check (
    has_itinerary_write_access(itinerary_id)
  );

create policy "day_tags_read" on day_tags
  for select using (
    exists (
      select 1
      from days
      join itineraries on itineraries.id = days.itinerary_id
      where days.id = day_tags.day_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "day_tags_write" on day_tags
  for all using (
    exists (
      select 1
      from days
      where days.id = day_tags.day_id
        and has_itinerary_write_access(days.itinerary_id)
    )
  ) with check (
    exists (
      select 1
      from days
      where days.id = day_tags.day_id
        and has_itinerary_write_access(days.itinerary_id)
    )
  );

create policy "schedule_item_tags_read" on schedule_item_tags
  for select using (
    exists (
      select 1
      from schedule_items
      join days on days.id = schedule_items.day_id
      join itineraries on itineraries.id = days.itinerary_id
      where schedule_items.id = schedule_item_tags.schedule_item_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "schedule_item_tags_write" on schedule_item_tags
  for all using (
    exists (
      select 1
      from schedule_items
      join days on days.id = schedule_items.day_id
      where schedule_items.id = schedule_item_tags.schedule_item_id
        and has_itinerary_write_access(days.itinerary_id)
    )
  ) with check (
    exists (
      select 1
      from schedule_items
      join days on days.id = schedule_items.day_id
      where schedule_items.id = schedule_item_tags.schedule_item_id
        and has_itinerary_write_access(days.itinerary_id)
    )
  );

create policy "locations_read" on locations
  for select using (
    exists (
      select 1 from itineraries
      where itineraries.id = locations.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "locations_write" on locations
  for all using (
    has_itinerary_write_access(itinerary_id)
  ) with check (
    has_itinerary_write_access(itinerary_id)
  );

create policy "routes_read" on routes
  for select using (
    exists (
      select 1 from itineraries
      where itineraries.id = routes.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "routes_write" on routes
  for all using (
    has_itinerary_write_access(itinerary_id)
  ) with check (
    has_itinerary_write_access(itinerary_id)
  );

create policy "flights_read" on flights
  for select using (
    exists (
      select 1 from itineraries
      where itineraries.id = flights.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "flights_write" on flights
  for all using (
    has_itinerary_write_access(itinerary_id)
  ) with check (
    has_itinerary_write_access(itinerary_id)
  );

create policy "itinerary_lists_read" on itinerary_lists
  for select using (
    exists (
      select 1 from itineraries
      where itineraries.id = itinerary_lists.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "itinerary_lists_write" on itinerary_lists
  for all using (
    has_itinerary_write_access(itinerary_id)
  ) with check (
    has_itinerary_write_access(itinerary_id)
  );

create policy "itinerary_list_items_read" on itinerary_list_items
  for select using (
    exists (
      select 1
      from itinerary_lists
      join itineraries on itineraries.id = itinerary_lists.itinerary_id
      where itinerary_lists.id = itinerary_list_items.list_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "itinerary_list_items_write" on itinerary_list_items
  for all using (
    exists (
      select 1
      from itinerary_lists
      where itinerary_lists.id = itinerary_list_items.list_id
        and has_itinerary_write_access(itinerary_lists.itinerary_id)
    )
  ) with check (
    exists (
      select 1
      from itinerary_lists
      where itinerary_lists.id = itinerary_list_items.list_id
        and has_itinerary_write_access(itinerary_lists.itinerary_id)
    )
  );

create policy "phrases_read" on phrases
  for select using (
    exists (
      select 1 from itineraries
      where itineraries.id = phrases.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "phrases_write" on phrases
  for all using (
    has_itinerary_write_access(itinerary_id)
  ) with check (
    has_itinerary_write_access(itinerary_id)
  );

create policy "budget_tiers_read" on budget_tiers
  for select using (
    exists (
      select 1 from itineraries
      where itineraries.id = budget_tiers.itinerary_id
        and itineraries.user_id = auth.uid()
    )
  );
create policy "budget_tiers_write" on budget_tiers
  for all using (
    has_itinerary_write_access(itinerary_id)
  ) with check (
    has_itinerary_write_access(itinerary_id)
  );

-- Función para obtener el email de un usuario (solo accesible por usuarios autenticados)
create or replace function get_user_email(user_uuid uuid)
returns text
language plpgsql
security definer
as $$
declare
  user_email text;
begin
  -- Obtener el email del usuario desde auth.users
  select email into user_email
  from auth.users
  where id = user_uuid;
  
  return user_email;
end;
$$;

revoke all on function get_user_email(uuid) from public;
grant execute on function get_user_email(uuid) to authenticated;

-- Función para actualizar emails de colaboradores existentes
create or replace function update_collaborator_emails()
returns void
language plpgsql
security definer
as $$
declare
  collab_record record;
  email_val text;
begin
  for collab_record in 
    select id, user_id 
    from itinerary_collaborators 
    where user_email is null
  loop
    -- Obtener email del usuario
    select email into email_val
    from auth.users
    where id = collab_record.user_id;
    
    -- Actualizar el registro
    if email_val is not null then
      update itinerary_collaborators
      set user_email = email_val
      where id = collab_record.id;
    end if;
  end loop;
end;
$$;

-- Ejecutar la función de migración una vez
select update_collaborator_emails();

-- Tablas para videos sociales
create table if not exists social_videos (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  user_id uuid not null,
  platform text not null check (platform in ('tiktok', 'instagram', 'youtube')),
  video_url text not null,
  embed_code text,
  thumbnail_url text,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists video_reactions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references social_videos(id) on delete cascade,
  user_id uuid not null,
  reaction_type text not null check (reaction_type in ('like', 'love', 'fire', 'laugh')),
  comment text,
  created_at timestamp with time zone default now(),
  unique (video_id, user_id)
);

create table if not exists video_tags (
  video_id uuid not null references social_videos(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (video_id, tag_id)
);

create index if not exists social_videos_itinerary_id_idx on social_videos (itinerary_id);
create index if not exists video_reactions_video_id_idx on video_reactions (video_id);
create index if not exists video_tags_video_id_idx on video_tags (video_id);

alter table social_videos enable row level security;
alter table video_reactions enable row level security;
alter table video_tags enable row level security;

-- Políticas RLS para social_videos
-- Cualquier persona con acceso al itinerario puede ver los videos
create policy "social_videos_read" on social_videos
  for select
  using (has_itinerary_access(itinerary_id));

-- Solo usuarios con permisos de escritura pueden agregar videos
create policy "social_videos_insert" on social_videos
  for insert
  with check (has_itinerary_write_access(itinerary_id));

-- Solo el creador del video puede actualizar o eliminar
create policy "social_videos_update" on social_videos
  for update
  using (user_id = auth.uid());

create policy "social_videos_delete" on social_videos
  for delete
  using (user_id = auth.uid());

-- Políticas RLS para video_reactions
-- Cualquier persona con acceso al itinerario puede ver reacciones
create policy "video_reactions_read" on video_reactions
  for select
  using (
    exists (
      select 1 from social_videos
      where social_videos.id = video_reactions.video_id
        and has_itinerary_access(social_videos.itinerary_id)
    )
  );

-- Usuarios con acceso al itinerario pueden agregar reacciones
create policy "video_reactions_insert" on video_reactions
  for insert
  with check (
    exists (
      select 1 from social_videos
      where social_videos.id = video_reactions.video_id
        and has_itinerary_access(social_videos.itinerary_id)
    )
  );

-- Solo el creador de la reacción puede actualizarla o eliminarla
create policy "video_reactions_update" on video_reactions
  for update
  using (user_id = auth.uid());

create policy "video_reactions_delete" on video_reactions
  for delete
  using (user_id = auth.uid());

-- Políticas RLS para video_tags
create policy "video_tags_read" on video_tags
  for select
  using (
    exists (
      select 1 from social_videos
      where social_videos.id = video_tags.video_id
        and has_itinerary_access(social_videos.itinerary_id)
    )
  );

create policy "video_tags_write" on video_tags
  for all
  using (
    exists (
      select 1 from social_videos
      where social_videos.id = video_tags.video_id
        and has_itinerary_write_access(social_videos.itinerary_id)
    )
  )
  with check (
    exists (
      select 1 from social_videos
      where social_videos.id = video_tags.video_id
        and has_itinerary_write_access(social_videos.itinerary_id)
    )
  );