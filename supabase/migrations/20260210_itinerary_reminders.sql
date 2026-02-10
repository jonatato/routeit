create table if not exists itinerary_reminders (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references itineraries(id) on delete cascade,
  reminder_type text not null,
  send_on date not null,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create unique index if not exists itinerary_reminders_unique_idx
  on itinerary_reminders (itinerary_id, reminder_type, send_on);

alter table itinerary_reminders enable row level security;
