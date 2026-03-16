alter table public.itineraries
  add column if not exists start_date date,
  add column if not exists end_date date;

create or replace function public._parse_itinerary_partial_date(value text, fallback_year integer)
returns date
language plpgsql
as $$
declare
  cleaned text;
  day_num integer;
  month_token text;
  year_num integer;
  month_num integer;
  match_iso text[];
  match_slash text[];
  match_text text[];
begin
  if value is null or btrim(value) = '' then
    return null;
  end if;

  cleaned := lower(trim(value));
  cleaned := regexp_replace(cleaned, '^[[:alpha:]áéíóúñ]+[\.,]?\s+', '');

  match_iso := regexp_match(cleaned, '(\d{4})-(\d{2})-(\d{2})');
  if match_iso is not null then
    return make_date(match_iso[1]::integer, match_iso[2]::integer, match_iso[3]::integer);
  end if;

  match_slash := regexp_match(cleaned, '(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?');
  if match_slash is not null then
    day_num := match_slash[1]::integer;
    month_num := match_slash[2]::integer;
    if match_slash[3] is not null and match_slash[3] <> '' then
      year_num := match_slash[3]::integer;
      if year_num < 100 then
        year_num := 2000 + year_num;
      end if;
    else
      year_num := fallback_year;
    end if;
    return make_date(year_num, month_num, day_num);
  end if;

  match_text := regexp_match(cleaned, '(\d{1,2})\s*(?:de\s+)?([[:alpha:]áéíóúñ]+)\s*(?:de\s+)?(\d{4})?');
  if match_text is null then
    return null;
  end if;

  day_num := match_text[1]::integer;
  month_token := match_text[2];

  month_num := case month_token
    when 'enero' then 1 when 'ene' then 1 when 'january' then 1 when 'jan' then 1
    when 'febrero' then 2 when 'feb' then 2 when 'february' then 2
    when 'marzo' then 3 when 'mar' then 3 when 'march' then 3
    when 'abril' then 4 when 'abr' then 4 when 'apr' then 4 when 'april' then 4
    when 'mayo' then 5 when 'may' then 5
    when 'junio' then 6 when 'jun' then 6 when 'june' then 6
    when 'julio' then 7 when 'jul' then 7 when 'july' then 7
    when 'agosto' then 8 when 'ago' then 8 when 'aug' then 8 when 'august' then 8
    when 'septiembre' then 9 when 'setiembre' then 9 when 'sep' then 9 when 'sept' then 9 when 'september' then 9
    when 'octubre' then 10 when 'oct' then 10 when 'october' then 10
    when 'noviembre' then 11 when 'nov' then 11 when 'november' then 11
    when 'diciembre' then 12 when 'dic' then 12 when 'dec' then 12 when 'december' then 12
    else null
  end;

  if month_num is null then
    return null;
  end if;

  if match_text[3] is not null and match_text[3] <> '' then
    year_num := match_text[3]::integer;
  else
    year_num := fallback_year;
  end if;

  return make_date(year_num, month_num, day_num);
exception
  when others then
    return null;
end;
$$;

with normalized as (
  select
    id,
    regexp_replace(date_range, '\s+(?:al?|a)\s+', ' - ', 'gi') as normalized_range
  from public.itineraries
), parsed as (
  select
    id,
    public._parse_itinerary_partial_date(trim(split_part(normalized_range, ' - ', 1)), extract(year from current_date)::integer) as parsed_start,
    public._parse_itinerary_partial_date(
      case
        when normalized_range like '% - %' then trim(split_part(normalized_range, ' - ', 2))
        else null
      end,
      extract(year from current_date)::integer
    ) as parsed_end
  from normalized
)
update public.itineraries i
set
  start_date = coalesce(i.start_date, p.parsed_start),
  end_date = coalesce(i.end_date, coalesce(p.parsed_end, p.parsed_start))
from parsed p
where i.id = p.id;
