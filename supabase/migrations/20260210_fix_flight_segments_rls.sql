-- Allow itinerary owners to access flight_segments in addition to collaborators

drop policy if exists "Users can view segments of their flights" on flight_segments;
drop policy if exists "Users can insert segments for their flights" on flight_segments;
drop policy if exists "Users can update segments of their flights" on flight_segments;
drop policy if exists "Users can delete segments of their flights" on flight_segments;

create policy "Users can view segments of their flights"
  on flight_segments for select
  using (
    exists (
      select 1
      from flights f
      join itineraries i on i.id = f.itinerary_id
      where f.id = flight_segments.flight_id
        and (
          i.user_id = auth.uid()
          or exists (
            select 1
            from itinerary_collaborators ic
            where ic.itinerary_id = f.itinerary_id
              and ic.user_id = auth.uid()
          )
        )
    )
  );

create policy "Users can insert segments for their flights"
  on flight_segments for insert
  with check (
    exists (
      select 1
      from flights f
      join itineraries i on i.id = f.itinerary_id
      where f.id = flight_segments.flight_id
        and (
          i.user_id = auth.uid()
          or exists (
            select 1
            from itinerary_collaborators ic
            where ic.itinerary_id = f.itinerary_id
              and ic.user_id = auth.uid()
              and ic.role in ('owner', 'editor')
          )
        )
    )
  );

create policy "Users can update segments of their flights"
  on flight_segments for update
  using (
    exists (
      select 1
      from flights f
      join itineraries i on i.id = f.itinerary_id
      where f.id = flight_segments.flight_id
        and (
          i.user_id = auth.uid()
          or exists (
            select 1
            from itinerary_collaborators ic
            where ic.itinerary_id = f.itinerary_id
              and ic.user_id = auth.uid()
              and ic.role in ('owner', 'editor')
          )
        )
    )
  );

create policy "Users can delete segments of their flights"
  on flight_segments for delete
  using (
    exists (
      select 1
      from flights f
      join itineraries i on i.id = f.itinerary_id
      where f.id = flight_segments.flight_id
        and (
          i.user_id = auth.uid()
          or exists (
            select 1
            from itinerary_collaborators ic
            where ic.itinerary_id = f.itinerary_id
              and ic.user_id = auth.uid()
              and ic.role in ('owner', 'editor')
          )
        )
    )
  );
