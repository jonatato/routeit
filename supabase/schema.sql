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
  slug text not null,
  color text default '#6366f1'
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

create table if not exists split_expense_documents (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references split_expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('receipt', 'invoice', 'ticket', 'other')),
  title text not null,
  subtitle text,
  reference text,
  url text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone,
  constraint split_expense_documents_non_empty_url check (length(trim(url)) > 0)
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

create table if not exists itinerary_documents (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('passport', 'flight', 'hotel', 'insurance', 'ground_transport', 'car_rental', 'other')),
  title text not null,
  subtitle text,
  reference text,
  url text not null,
  expiry_date date,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone,
  constraint itinerary_documents_non_empty_url check (length(trim(url)) > 0)
);

create index if not exists idx_itinerary_documents_itinerary on itinerary_documents (itinerary_id);
create index if not exists idx_itinerary_documents_expiry on itinerary_documents (expiry_date);
create index if not exists idx_itinerary_documents_visibility on itinerary_documents (itinerary_id, visibility, created_at desc);

create table if not exists itinerary_document_submissions (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  reviewed_by uuid references auth.users(id) on delete set null,
  approved_document_id uuid references itinerary_documents(id) on delete set null,
  type text not null check (type in ('passport', 'flight', 'hotel', 'insurance', 'ground_transport', 'car_rental', 'other')),
  title text not null,
  subtitle text,
  reference text,
  url text not null,
  expiry_date date,
  target_visibility text not null default 'public' check (target_visibility = 'public'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  review_note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  deleted_at timestamp with time zone,
  constraint itinerary_document_submissions_non_empty_url check (length(trim(url)) > 0)
);

create index if not exists idx_itinerary_document_submissions_itinerary on itinerary_document_submissions (itinerary_id, status, created_at desc);
create index if not exists idx_itinerary_document_submissions_submitter on itinerary_document_submissions (submitted_by, created_at desc);

alter table schedule_items
  add column if not exists related_document_id uuid references itinerary_documents(id) on delete set null;

create index if not exists idx_schedule_items_related_document_id on schedule_items (related_document_id);
create index if not exists idx_split_expense_documents_expense on split_expense_documents (expense_id);
create index if not exists idx_split_expense_documents_created_at on split_expense_documents (created_at desc);

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
alter table split_expense_documents enable row level security;
alter table split_tags enable row level security;
alter table split_expense_tags enable row level security;
alter table split_notifications enable row level security;
alter table split_payment_reminders enable row level security;
alter table split_refunds enable row level security;
alter table itinerary_section_preferences enable row level security;
alter table itinerary_documents enable row level security;
alter table itinerary_document_submissions enable row level security;

create or replace function is_itinerary_member(itinerary_uuid uuid)
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

create policy "split_expense_documents_access" on split_expense_documents
  for all
  using (
    exists (select 1 from split_expenses
      join split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_documents.expense_id
        and (exists (select 1 from itineraries where itineraries.id = split_groups.itinerary_id and itineraries.user_id = auth.uid())
          or exists (select 1 from itinerary_collaborators where itinerary_collaborators.itinerary_id = split_groups.itinerary_id and itinerary_collaborators.user_id = auth.uid())
        )
    )
  )
  with check (
    user_id = auth.uid()
    and exists (select 1 from split_expenses
      join split_groups on split_groups.id = split_expenses.group_id
      where split_expenses.id = split_expense_documents.expense_id
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

create policy "itinerary_documents_read" on itinerary_documents
  for select
  using (
    (visibility = 'private' and user_id = auth.uid())
    or (
      visibility = 'public'
      and is_itinerary_member(itinerary_id)
    )
  );

create policy "itinerary_documents_insert" on itinerary_documents
  for insert
  with check (
    user_id = auth.uid()
    and is_itinerary_member(itinerary_id)
    and (
      visibility = 'private'
      or exists (
        select 1 from itineraries
        where itineraries.id = itinerary_documents.itinerary_id
          and itineraries.user_id = auth.uid()
      )
      or is_itinerary_editor(itinerary_id)
    )
  );

create policy "itinerary_documents_update" on itinerary_documents
  for update
  using (
    (visibility = 'private' and user_id = auth.uid())
    or (
      visibility = 'public'
      and (
        exists (
          select 1 from itineraries
          where itineraries.id = itinerary_documents.itinerary_id
            and itineraries.user_id = auth.uid()
        )
        or is_itinerary_editor(itinerary_id)
      )
    )
  )
  with check (
    (
      visibility = 'private'
      and user_id = auth.uid()
      and is_itinerary_member(itinerary_id)
    )
    or (
      visibility = 'public'
      and (
        exists (
          select 1 from itineraries
          where itineraries.id = itinerary_documents.itinerary_id
            and itineraries.user_id = auth.uid()
        )
        or is_itinerary_editor(itinerary_id)
      )
    )
  );

create policy "itinerary_documents_delete" on itinerary_documents
  for delete
  using (
    (visibility = 'private' and user_id = auth.uid())
    or (
      visibility = 'public'
      and (
        exists (
          select 1 from itineraries
          where itineraries.id = itinerary_documents.itinerary_id
            and itineraries.user_id = auth.uid()
        )
        or is_itinerary_editor(itinerary_id)
      )
    )
  );

create policy "itinerary_document_submissions_read" on itinerary_document_submissions
  for select
  using (
    submitted_by = auth.uid()
    or exists (
      select 1 from itineraries
      where itineraries.id = itinerary_document_submissions.itinerary_id
        and itineraries.user_id = auth.uid()
    )
    or is_itinerary_editor(itinerary_id)
  );

create policy "itinerary_document_submissions_insert" on itinerary_document_submissions
  for insert
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
    and target_visibility = 'public'
    and exists (
      select 1 from itinerary_collaborators
      where itinerary_collaborators.itinerary_id = itinerary_document_submissions.itinerary_id
        and itinerary_collaborators.user_id = auth.uid()
        and itinerary_collaborators.role = 'viewer'
        and itinerary_collaborators.deleted_at is null
    )
  );

create policy "itinerary_document_submissions_update_submitter" on itinerary_document_submissions
  for update
  using (
    submitted_by = auth.uid()
    and status = 'pending'
  )
  with check (
    submitted_by = auth.uid()
    and status in ('pending', 'cancelled')
  );

create policy "itinerary_document_submissions_update_reviewers" on itinerary_document_submissions
  for update
  using (
    exists (
      select 1 from itineraries
      where itineraries.id = itinerary_document_submissions.itinerary_id
        and itineraries.user_id = auth.uid()
    )
    or is_itinerary_editor(itinerary_id)
  )
  with check (
    exists (
      select 1 from itineraries
      where itineraries.id = itinerary_document_submissions.itinerary_id
        and itineraries.user_id = auth.uid()
    )
    or is_itinerary_editor(itinerary_id)
  );

create or replace function approve_itinerary_document_submission(submission_uuid uuid, note text default null)
returns itinerary_documents
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_record itinerary_document_submissions%rowtype;
  approved_document itinerary_documents%rowtype;
begin
  select *
  into submission_record
  from itinerary_document_submissions
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
      select 1 from itineraries
      where itineraries.id = submission_record.itinerary_id
        and itineraries.user_id = auth.uid()
    )
    or is_itinerary_editor(submission_record.itinerary_id)
  ) then
    raise exception 'Not authorized to approve this submission';
  end if;

  insert into itinerary_documents (
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

  update itinerary_document_submissions
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

create table if not exists video_filter_tags (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (itinerary_id, slug)
);

create table if not exists social_video_tag_links (
  video_id uuid not null references social_videos(id) on delete cascade,
  tag_id uuid not null references video_filter_tags(id) on delete cascade,
  primary key (video_id, tag_id)
);

create index if not exists social_videos_itinerary_id_idx on social_videos (itinerary_id);
create index if not exists video_reactions_video_id_idx on video_reactions (video_id);
create index if not exists video_tags_video_id_idx on video_tags (video_id);
create index if not exists video_filter_tags_itinerary_id_idx on video_filter_tags (itinerary_id);
create index if not exists social_video_tag_links_tag_id_idx on social_video_tag_links (tag_id);

alter table social_videos enable row level security;
alter table video_reactions enable row level security;
alter table video_tags enable row level security;
alter table video_filter_tags enable row level security;
alter table social_video_tag_links enable row level security;

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

create policy "video_filter_tags_read" on video_filter_tags
  for select
  using (has_itinerary_access(itinerary_id));

create policy "video_filter_tags_insert" on video_filter_tags
  for insert
  with check (has_itinerary_write_access(itinerary_id));

create policy "video_filter_tags_update" on video_filter_tags
  for update
  using (has_itinerary_write_access(itinerary_id))
  with check (has_itinerary_write_access(itinerary_id));

create policy "video_filter_tags_delete" on video_filter_tags
  for delete
  using (has_itinerary_write_access(itinerary_id));

create policy "social_video_tag_links_read" on social_video_tag_links
  for select
  using (
    exists (
      select 1 from social_videos
      where social_videos.id = social_video_tag_links.video_id
        and has_itinerary_access(social_videos.itinerary_id)
    )
  );

create policy "social_video_tag_links_insert" on social_video_tag_links
  for insert
  with check (
    exists (
      select 1 from social_videos
      where social_videos.id = social_video_tag_links.video_id
        and has_itinerary_write_access(social_videos.itinerary_id)
    )
  );

create policy "social_video_tag_links_delete" on social_video_tag_links
  for delete
  using (
    exists (
      select 1 from social_videos
      where social_videos.id = social_video_tag_links.video_id
        and has_itinerary_write_access(social_videos.itinerary_id)
    )
  );

-- Billing & entitlements
create table if not exists billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamp with time zone default now(),
  unique (user_id)
);

create table if not exists billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_subscription_id text not null unique,
  price_id text,
  status text not null,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  updated_at timestamp with time zone default now()
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

alter table billing_customers enable row level security;
alter table billing_subscriptions enable row level security;
alter table user_entitlements enable row level security;
alter table analytics_events enable row level security;

create policy "billing_customers_owner_read" on billing_customers
  for select using (user_id = auth.uid());

create policy "billing_subscriptions_owner_read" on billing_subscriptions
  for select using (user_id = auth.uid());

create policy "user_entitlements_owner_read" on user_entitlements
  for select using (user_id = auth.uid());

create policy "analytics_events_owner" on analytics_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function is_pro_user(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select
    exists (
      select 1
      from billing_subscriptions
      where billing_subscriptions.user_id = is_pro_user.user_id
        and billing_subscriptions.status in ('active', 'trialing')
        and (billing_subscriptions.current_period_end is null or billing_subscriptions.current_period_end > now())
    )
    or exists (
      select 1
      from user_entitlements
      where user_entitlements.user_id = is_pro_user.user_id
        and user_entitlements.plan = 'pro'
    );
$$;

create or replace function can_create_itinerary(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select
    is_pro_user(can_create_itinerary.user_id)
    or (
      select count(*)
      from itineraries
      where itineraries.user_id = can_create_itinerary.user_id
        and itineraries.deleted_at is null
    ) < 2;
$$;

revoke all on function is_pro_user(uuid) from public;
revoke all on function can_create_itinerary(uuid) from public;
grant execute on function is_pro_user(uuid) to authenticated;
grant execute on function can_create_itinerary(uuid) to authenticated;

create or replace function handle_new_user_entitlements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into user_entitlements (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_entitlements on auth.users;
create trigger on_auth_user_created_entitlements
  after insert on auth.users
  for each row execute function handle_new_user_entitlements();

create policy "itineraries_insert" on itineraries
  for insert
  with check (auth.uid() = user_id and can_create_itinerary(auth.uid()));

create policy "itineraries_update" on itineraries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "itineraries_delete" on itineraries
  for delete
  using (auth.uid() = user_id);

create table if not exists public.itinerary_document_passport_details (
  document_id uuid unique references public.itinerary_documents(id) on delete cascade,
  submission_id uuid unique references public.itinerary_document_submissions(id) on delete cascade,
  holder_name text,
  nationality text,
  issuing_country text,
  document_number text,
  date_of_birth date,
  issued_on date,
  expires_on date,
  constraint itinerary_document_passport_details_parent_check
    check (num_nonnulls(document_id, submission_id) = 1)
);

create table if not exists public.itinerary_document_flight_details (
  document_id uuid unique references public.itinerary_documents(id) on delete cascade,
  submission_id uuid unique references public.itinerary_document_submissions(id) on delete cascade,
  passenger_name text,
  airline text,
  flight_number text,
  departure_airport text,
  arrival_airport text,
  departure_at timestamptz,
  arrival_at timestamptz,
  terminal text,
  gate text,
  seat text,
  travel_class text,
  constraint itinerary_document_flight_details_parent_check
    check (num_nonnulls(document_id, submission_id) = 1)
);

create table if not exists public.itinerary_document_hotel_details (
  document_id uuid unique references public.itinerary_documents(id) on delete cascade,
  submission_id uuid unique references public.itinerary_document_submissions(id) on delete cascade,
  property_name text,
  guest_name text,
  address text,
  check_in_on date,
  check_out_on date,
  room_type text,
  board_type text,
  constraint itinerary_document_hotel_details_parent_check
    check (num_nonnulls(document_id, submission_id) = 1)
);

create table if not exists public.itinerary_document_insurance_details (
  document_id uuid unique references public.itinerary_documents(id) on delete cascade,
  submission_id uuid unique references public.itinerary_document_submissions(id) on delete cascade,
  provider text,
  policy_number text,
  insured_person text,
  coverage_start_on date,
  coverage_end_on date,
  assistance_phone text,
  emergency_contact text,
  constraint itinerary_document_insurance_details_parent_check
    check (num_nonnulls(document_id, submission_id) = 1)
);

create table if not exists public.itinerary_document_ground_transport_details (
  document_id uuid unique references public.itinerary_documents(id) on delete cascade,
  submission_id uuid unique references public.itinerary_document_submissions(id) on delete cascade,
  transport_mode text,
  operator_name text,
  passenger_name text,
  departure_location text,
  arrival_location text,
  departure_at timestamptz,
  arrival_at timestamptz,
  seat text,
  constraint itinerary_document_ground_transport_details_parent_check
    check (num_nonnulls(document_id, submission_id) = 1)
);

create table if not exists public.itinerary_document_car_rental_details (
  document_id uuid unique references public.itinerary_documents(id) on delete cascade,
  submission_id uuid unique references public.itinerary_document_submissions(id) on delete cascade,
  company_name text,
  driver_name text,
  pickup_location text,
  dropoff_location text,
  pickup_at timestamptz,
  dropoff_at timestamptz,
  vehicle_type text,
  confirmation_number text,
  constraint itinerary_document_car_rental_details_parent_check
    check (num_nonnulls(document_id, submission_id) = 1)
);

create table if not exists public.itinerary_document_other_details (
  document_id uuid unique references public.itinerary_documents(id) on delete cascade,
  submission_id uuid unique references public.itinerary_document_submissions(id) on delete cascade,
  owner_name text,
  issuer text,
  valid_from_on date,
  valid_until_on date,
  notes text,
  constraint itinerary_document_other_details_parent_check
    check (num_nonnulls(document_id, submission_id) = 1)
);

alter table public.itinerary_document_passport_details enable row level security;
alter table public.itinerary_document_flight_details enable row level security;
alter table public.itinerary_document_hotel_details enable row level security;
alter table public.itinerary_document_insurance_details enable row level security;
alter table public.itinerary_document_ground_transport_details enable row level security;
alter table public.itinerary_document_car_rental_details enable row level security;
alter table public.itinerary_document_other_details enable row level security;

create or replace function public.can_read_itinerary_document_detail(detail_document_id uuid, detail_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select (
    detail_document_id is not null
    and exists (
      select 1
      from public.itinerary_documents d
      where d.id = detail_document_id
        and d.deleted_at is null
        and (
          (d.visibility = 'private' and d.user_id = auth.uid())
          or (d.visibility = 'public' and public.is_itinerary_member(d.itinerary_id))
        )
    )
  )
  or (
    detail_submission_id is not null
    and exists (
      select 1
      from public.itinerary_document_submissions s
      where s.id = detail_submission_id
        and s.deleted_at is null
        and (
          s.submitted_by = auth.uid()
          or exists (
            select 1
            from public.itineraries i
            where i.id = s.itinerary_id
              and i.user_id = auth.uid()
          )
          or public.is_itinerary_editor(s.itinerary_id)
        )
    )
  );
$$;

create or replace function public.can_manage_itinerary_document_detail(detail_document_id uuid, detail_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select (
    detail_document_id is not null
    and exists (
      select 1
      from public.itinerary_documents d
      where d.id = detail_document_id
        and d.deleted_at is null
        and (
          (
            d.visibility = 'private'
            and d.user_id = auth.uid()
            and public.is_itinerary_member(d.itinerary_id)
          )
          or (
            d.visibility = 'public'
            and (
              exists (
                select 1
                from public.itineraries i
                where i.id = d.itinerary_id
                  and i.user_id = auth.uid()
              )
              or public.is_itinerary_editor(d.itinerary_id)
            )
          )
        )
    )
  )
  or (
    detail_submission_id is not null
    and exists (
      select 1
      from public.itinerary_document_submissions s
      where s.id = detail_submission_id
        and s.deleted_at is null
        and (
          (s.submitted_by = auth.uid() and s.status = 'pending')
          or exists (
            select 1
            from public.itineraries i
            where i.id = s.itinerary_id
              and i.user_id = auth.uid()
          )
          or public.is_itinerary_editor(s.itinerary_id)
        )
    )
  );
$$;

grant execute on function public.can_read_itinerary_document_detail(uuid, uuid) to authenticated;
grant execute on function public.can_manage_itinerary_document_detail(uuid, uuid) to authenticated;

drop policy if exists "itinerary_document_passport_details_read" on public.itinerary_document_passport_details;
create policy "itinerary_document_passport_details_read" on public.itinerary_document_passport_details
  for select
  using (public.can_read_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_passport_details_insert" on public.itinerary_document_passport_details;
create policy "itinerary_document_passport_details_insert" on public.itinerary_document_passport_details
  for insert
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_passport_details_update" on public.itinerary_document_passport_details;
create policy "itinerary_document_passport_details_update" on public.itinerary_document_passport_details
  for update
  using (public.can_manage_itinerary_document_detail(document_id, submission_id))
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_passport_details_delete" on public.itinerary_document_passport_details;
create policy "itinerary_document_passport_details_delete" on public.itinerary_document_passport_details
  for delete
  using (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_flight_details_read" on public.itinerary_document_flight_details;
create policy "itinerary_document_flight_details_read" on public.itinerary_document_flight_details
  for select
  using (public.can_read_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_flight_details_insert" on public.itinerary_document_flight_details;
create policy "itinerary_document_flight_details_insert" on public.itinerary_document_flight_details
  for insert
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_flight_details_update" on public.itinerary_document_flight_details;
create policy "itinerary_document_flight_details_update" on public.itinerary_document_flight_details
  for update
  using (public.can_manage_itinerary_document_detail(document_id, submission_id))
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_flight_details_delete" on public.itinerary_document_flight_details;
create policy "itinerary_document_flight_details_delete" on public.itinerary_document_flight_details
  for delete
  using (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_hotel_details_read" on public.itinerary_document_hotel_details;
create policy "itinerary_document_hotel_details_read" on public.itinerary_document_hotel_details
  for select
  using (public.can_read_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_hotel_details_insert" on public.itinerary_document_hotel_details;
create policy "itinerary_document_hotel_details_insert" on public.itinerary_document_hotel_details
  for insert
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_hotel_details_update" on public.itinerary_document_hotel_details;
create policy "itinerary_document_hotel_details_update" on public.itinerary_document_hotel_details
  for update
  using (public.can_manage_itinerary_document_detail(document_id, submission_id))
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_hotel_details_delete" on public.itinerary_document_hotel_details;
create policy "itinerary_document_hotel_details_delete" on public.itinerary_document_hotel_details
  for delete
  using (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_insurance_details_read" on public.itinerary_document_insurance_details;
create policy "itinerary_document_insurance_details_read" on public.itinerary_document_insurance_details
  for select
  using (public.can_read_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_insurance_details_insert" on public.itinerary_document_insurance_details;
create policy "itinerary_document_insurance_details_insert" on public.itinerary_document_insurance_details
  for insert
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_insurance_details_update" on public.itinerary_document_insurance_details;
create policy "itinerary_document_insurance_details_update" on public.itinerary_document_insurance_details
  for update
  using (public.can_manage_itinerary_document_detail(document_id, submission_id))
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_insurance_details_delete" on public.itinerary_document_insurance_details;
create policy "itinerary_document_insurance_details_delete" on public.itinerary_document_insurance_details
  for delete
  using (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_ground_transport_details_read" on public.itinerary_document_ground_transport_details;
create policy "itinerary_document_ground_transport_details_read" on public.itinerary_document_ground_transport_details
  for select
  using (public.can_read_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_ground_transport_details_insert" on public.itinerary_document_ground_transport_details;
create policy "itinerary_document_ground_transport_details_insert" on public.itinerary_document_ground_transport_details
  for insert
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_ground_transport_details_update" on public.itinerary_document_ground_transport_details;
create policy "itinerary_document_ground_transport_details_update" on public.itinerary_document_ground_transport_details
  for update
  using (public.can_manage_itinerary_document_detail(document_id, submission_id))
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_ground_transport_details_delete" on public.itinerary_document_ground_transport_details;
create policy "itinerary_document_ground_transport_details_delete" on public.itinerary_document_ground_transport_details
  for delete
  using (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_car_rental_details_read" on public.itinerary_document_car_rental_details;
create policy "itinerary_document_car_rental_details_read" on public.itinerary_document_car_rental_details
  for select
  using (public.can_read_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_car_rental_details_insert" on public.itinerary_document_car_rental_details;
create policy "itinerary_document_car_rental_details_insert" on public.itinerary_document_car_rental_details
  for insert
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_car_rental_details_update" on public.itinerary_document_car_rental_details;
create policy "itinerary_document_car_rental_details_update" on public.itinerary_document_car_rental_details
  for update
  using (public.can_manage_itinerary_document_detail(document_id, submission_id))
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_car_rental_details_delete" on public.itinerary_document_car_rental_details;
create policy "itinerary_document_car_rental_details_delete" on public.itinerary_document_car_rental_details
  for delete
  using (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_other_details_read" on public.itinerary_document_other_details;
create policy "itinerary_document_other_details_read" on public.itinerary_document_other_details
  for select
  using (public.can_read_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_other_details_insert" on public.itinerary_document_other_details;
create policy "itinerary_document_other_details_insert" on public.itinerary_document_other_details
  for insert
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_other_details_update" on public.itinerary_document_other_details;
create policy "itinerary_document_other_details_update" on public.itinerary_document_other_details
  for update
  using (public.can_manage_itinerary_document_detail(document_id, submission_id))
  with check (public.can_manage_itinerary_document_detail(document_id, submission_id));

drop policy if exists "itinerary_document_other_details_delete" on public.itinerary_document_other_details;
create policy "itinerary_document_other_details_delete" on public.itinerary_document_other_details
  for delete
  using (public.can_manage_itinerary_document_detail(document_id, submission_id));

create or replace function public.copy_itinerary_document_submission_details(
  submission_uuid uuid,
  approved_document_uuid uuid,
  submission_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  case submission_type
    when 'passport' then
      insert into public.itinerary_document_passport_details (
        document_id,
        holder_name,
        nationality,
        issuing_country,
        document_number,
        date_of_birth,
        issued_on,
        expires_on
      )
      select
        approved_document_uuid,
        holder_name,
        nationality,
        issuing_country,
        document_number,
        date_of_birth,
        issued_on,
        expires_on
      from public.itinerary_document_passport_details
      where submission_id = submission_uuid
      on conflict (document_id) do update
      set holder_name = excluded.holder_name,
          nationality = excluded.nationality,
          issuing_country = excluded.issuing_country,
          document_number = excluded.document_number,
          date_of_birth = excluded.date_of_birth,
          issued_on = excluded.issued_on,
          expires_on = excluded.expires_on;
    when 'flight' then
      insert into public.itinerary_document_flight_details (
        document_id,
        passenger_name,
        airline,
        flight_number,
        departure_airport,
        arrival_airport,
        departure_at,
        arrival_at,
        terminal,
        gate,
        seat,
        travel_class
      )
      select
        approved_document_uuid,
        passenger_name,
        airline,
        flight_number,
        departure_airport,
        arrival_airport,
        departure_at,
        arrival_at,
        terminal,
        gate,
        seat,
        travel_class
      from public.itinerary_document_flight_details
      where submission_id = submission_uuid
      on conflict (document_id) do update
      set passenger_name = excluded.passenger_name,
          airline = excluded.airline,
          flight_number = excluded.flight_number,
          departure_airport = excluded.departure_airport,
          arrival_airport = excluded.arrival_airport,
          departure_at = excluded.departure_at,
          arrival_at = excluded.arrival_at,
          terminal = excluded.terminal,
          gate = excluded.gate,
          seat = excluded.seat,
          travel_class = excluded.travel_class;
    when 'hotel' then
      insert into public.itinerary_document_hotel_details (
        document_id,
        property_name,
        guest_name,
        address,
        check_in_on,
        check_out_on,
        room_type,
        board_type
      )
      select
        approved_document_uuid,
        property_name,
        guest_name,
        address,
        check_in_on,
        check_out_on,
        room_type,
        board_type
      from public.itinerary_document_hotel_details
      where submission_id = submission_uuid
      on conflict (document_id) do update
      set property_name = excluded.property_name,
          guest_name = excluded.guest_name,
          address = excluded.address,
          check_in_on = excluded.check_in_on,
          check_out_on = excluded.check_out_on,
          room_type = excluded.room_type,
          board_type = excluded.board_type;
    when 'insurance' then
      insert into public.itinerary_document_insurance_details (
        document_id,
        provider,
        policy_number,
        insured_person,
        coverage_start_on,
        coverage_end_on,
        assistance_phone,
        emergency_contact
      )
      select
        approved_document_uuid,
        provider,
        policy_number,
        insured_person,
        coverage_start_on,
        coverage_end_on,
        assistance_phone,
        emergency_contact
      from public.itinerary_document_insurance_details
      where submission_id = submission_uuid
      on conflict (document_id) do update
      set provider = excluded.provider,
          policy_number = excluded.policy_number,
          insured_person = excluded.insured_person,
          coverage_start_on = excluded.coverage_start_on,
          coverage_end_on = excluded.coverage_end_on,
          assistance_phone = excluded.assistance_phone,
          emergency_contact = excluded.emergency_contact;
    when 'ground_transport' then
      insert into public.itinerary_document_ground_transport_details (
        document_id,
        transport_mode,
        operator_name,
        passenger_name,
        departure_location,
        arrival_location,
        departure_at,
        arrival_at,
        seat
      )
      select
        approved_document_uuid,
        transport_mode,
        operator_name,
        passenger_name,
        departure_location,
        arrival_location,
        departure_at,
        arrival_at,
        seat
      from public.itinerary_document_ground_transport_details
      where submission_id = submission_uuid
      on conflict (document_id) do update
      set transport_mode = excluded.transport_mode,
          operator_name = excluded.operator_name,
          passenger_name = excluded.passenger_name,
          departure_location = excluded.departure_location,
          arrival_location = excluded.arrival_location,
          departure_at = excluded.departure_at,
          arrival_at = excluded.arrival_at,
          seat = excluded.seat;
    when 'car_rental' then
      insert into public.itinerary_document_car_rental_details (
        document_id,
        company_name,
        driver_name,
        pickup_location,
        dropoff_location,
        pickup_at,
        dropoff_at,
        vehicle_type,
        confirmation_number
      )
      select
        approved_document_uuid,
        company_name,
        driver_name,
        pickup_location,
        dropoff_location,
        pickup_at,
        dropoff_at,
        vehicle_type,
        confirmation_number
      from public.itinerary_document_car_rental_details
      where submission_id = submission_uuid
      on conflict (document_id) do update
      set company_name = excluded.company_name,
          driver_name = excluded.driver_name,
          pickup_location = excluded.pickup_location,
          dropoff_location = excluded.dropoff_location,
          pickup_at = excluded.pickup_at,
          dropoff_at = excluded.dropoff_at,
          vehicle_type = excluded.vehicle_type,
          confirmation_number = excluded.confirmation_number;
    when 'other' then
      insert into public.itinerary_document_other_details (
        document_id,
        owner_name,
        issuer,
        valid_from_on,
        valid_until_on,
        notes
      )
      select
        approved_document_uuid,
        owner_name,
        issuer,
        valid_from_on,
        valid_until_on,
        notes
      from public.itinerary_document_other_details
      where submission_id = submission_uuid
      on conflict (document_id) do update
      set owner_name = excluded.owner_name,
          issuer = excluded.issuer,
          valid_from_on = excluded.valid_from_on,
          valid_until_on = excluded.valid_until_on,
          notes = excluded.notes;
    else
      null;
  end case;
end;
$$;

grant execute on function public.copy_itinerary_document_submission_details(uuid, uuid, text) to authenticated;

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

  perform public.copy_itinerary_document_submission_details(
    submission_record.id,
    approved_document.id,
    submission_record.type
  );

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
