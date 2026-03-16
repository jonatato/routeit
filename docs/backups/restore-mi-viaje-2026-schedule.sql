-- Restauracion propuesta (NO ejecutada automaticamente)
-- Fuente elegida: itinerario antiguo con horarios
--   source_itinerary_id = de92fd9c-f39d-4ade-9ae8-c485e4e8a4c3
-- Destino activo:
--   target_itinerary_id = b1a7eeea-3625-4ec6-a411-63731c97bda2

begin;

-- 1) Seguridad adicional: abortar si destino ya tiene horarios
-- (descomentar si quieres forzar bloqueo)
-- do $$
-- declare v_count int;
-- begin
--   select count(*) into v_count
--   from schedule_items si
--   join days d on d.id = si.day_id
--   where d.itinerary_id = 'b1a7eeea-3625-4ec6-a411-63731c97bda2';
--   if v_count > 0 then
--     raise exception 'Destino ya tiene schedule_items (%). Abortado.', v_count;
--   end if;
-- end $$;

-- 2) Insertar horarios desde el source al target mapeando por order_index de dia
insert into schedule_items (
  day_id,
  time,
  activity,
  link,
  map_link,
  lat,
  lng,
  order_index,
  cost,
  cost_currency,
  cost_payer_id,
  cost_split_expense_id
)
select
  td.id as day_id,
  si.time,
  si.activity,
  si.link,
  si.map_link,
  si.lat,
  si.lng,
  si.order_index,
  si.cost,
  si.cost_currency,
  si.cost_payer_id,
  si.cost_split_expense_id
from schedule_items si
join days sd on sd.id = si.day_id
join days td
  on td.itinerary_id = 'b1a7eeea-3625-4ec6-a411-63731c97bda2'
 and td.order_index = sd.order_index
where sd.itinerary_id = 'de92fd9c-f39d-4ade-9ae8-c485e4e8a4c3';

-- 3) Verificacion rapida
-- select count(*)
-- from schedule_items si
-- join days d on d.id = si.day_id
-- where d.itinerary_id = 'b1a7eeea-3625-4ec6-a411-63731c97bda2';

commit;
