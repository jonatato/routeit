-- Migration: Billing (Stripe) + analytics events + freemium limits

-- Billing tables
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

-- Analytics events
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- RLS
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

-- Entitlements helper functions
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

-- Insert default entitlements for new users
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

-- Enforce freemium limit on itineraries insert
drop policy if exists "itineraries_write" on itineraries;
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
