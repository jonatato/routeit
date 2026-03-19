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
