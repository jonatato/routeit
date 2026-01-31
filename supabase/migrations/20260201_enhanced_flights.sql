-- Migration: Enhanced flights structure
-- Supports multiple flights per itinerary and multiple segments (layovers) per flight

-- Add new columns to flights table
alter table flights add column if not exists label text;
alter table flights add column if not exists booking_reference text;
alter table flights add column if not exists seat text;
alter table flights add column if not exists cabin_class text check (cabin_class in ('economy', 'premium_economy', 'business', 'first'));
alter table flights add column if not exists status text default 'confirmed' check (status in ('confirmed', 'pending', 'cancelled', 'delayed'));
alter table flights add column if not exists total_duration text;
alter table flights add column if not exists stops_count integer default 0;
alter table flights add column if not exists order_index integer default 0;
alter table flights add column if not exists created_at timestamp with time zone default now();
alter table flights add column if not exists updated_at timestamp with time zone default now();

-- Create flight_segments table for multi-leg flights
create table if not exists flight_segments (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid not null references flights(id) on delete cascade,
  order_index integer not null default 0,
  airline text,
  airline_code text,
  flight_number text,
  departure_airport text not null,
  departure_city text not null,
  departure_time text not null,
  departure_terminal text,
  departure_lat double precision,
  departure_lng double precision,
  arrival_airport text not null,
  arrival_city text not null,
  arrival_time text not null,
  arrival_terminal text,
  arrival_lat double precision,
  arrival_lng double precision,
  duration text not null,
  created_at timestamp with time zone default now()
);

-- Create index for flight_segments
create index if not exists flight_segments_flight_id_idx on flight_segments (flight_id);
create index if not exists flight_segments_order_idx on flight_segments (flight_id, order_index);

-- Create index for flights
create index if not exists flights_itinerary_id_idx on flights (itinerary_id);
create index if not exists flights_order_idx on flights (itinerary_id, order_index);

-- Enable RLS
alter table flight_segments enable row level security;

-- RLS policies for flight_segments (inherit from flights via itinerary)
create policy "Users can view segments of their flights"
  on flight_segments for select
  using (
    exists (
      select 1 from flights f
      join itinerary_collaborators ic on ic.itinerary_id = f.itinerary_id
      where f.id = flight_segments.flight_id
      and ic.user_id = auth.uid()
    )
  );

create policy "Users can insert segments for their flights"
  on flight_segments for insert
  with check (
    exists (
      select 1 from flights f
      join itinerary_collaborators ic on ic.itinerary_id = f.itinerary_id
      where f.id = flight_segments.flight_id
      and ic.user_id = auth.uid()
      and ic.role in ('owner', 'editor')
    )
  );

create policy "Users can update segments of their flights"
  on flight_segments for update
  using (
    exists (
      select 1 from flights f
      join itinerary_collaborators ic on ic.itinerary_id = f.itinerary_id
      where f.id = flight_segments.flight_id
      and ic.user_id = auth.uid()
      and ic.role in ('owner', 'editor')
    )
  );

create policy "Users can delete segments of their flights"
  on flight_segments for delete
  using (
    exists (
      select 1 from flights f
      join itinerary_collaborators ic on ic.itinerary_id = f.itinerary_id
      where f.id = flight_segments.flight_id
      and ic.user_id = auth.uid()
      and ic.role in ('owner', 'editor')
    )
  );

-- Migrate existing flight data to segments
-- For each existing flight, create a single segment with the legacy data
insert into flight_segments (flight_id, order_index, departure_airport, departure_city, departure_time, arrival_airport, arrival_city, arrival_time, duration)
select 
  f.id as flight_id,
  0 as order_index,
  -- Extract airport code from "City (ABC)" format, or use first 3 chars
  coalesce(
    substring(f.from_city from '\(([A-Z]{3})\)'),
    upper(left(f.from_city, 3))
  ) as departure_airport,
  -- Extract city name from "City (ABC)" format
  coalesce(
    trim(substring(f.from_city from '^(.+?)\s*\(')),
    f.from_city
  ) as departure_city,
  f.from_time as departure_time,
  coalesce(
    substring(f.to_city from '\(([A-Z]{3})\)'),
    upper(left(f.to_city, 3))
  ) as arrival_airport,
  coalesce(
    trim(substring(f.to_city from '^(.+?)\s*\(')),
    f.to_city
  ) as arrival_city,
  f.to_time as arrival_time,
  f.duration
from flights f
where not exists (
  select 1 from flight_segments fs where fs.flight_id = f.id
);

-- Update stops_count based on legacy stops field
update flights 
set stops_count = case 
  when lower(stops) = 'directo' then 0
  when lower(stops) like '%1%' then 1
  when lower(stops) like '%2%' then 2
  else 0
end,
total_duration = duration
where stops_count is null or stops_count = 0;
