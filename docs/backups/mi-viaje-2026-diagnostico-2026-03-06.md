# Diagnostico y backup - Mi Viaje 2026 (2026-03-06)

## Resultado clave
- El itinerario activo `b1a7eeea-3625-4ec6-a411-63731c97bda2` tiene 23 dias y **0** filas en `schedule_items`.
- Las actividades que si existen en DB estan en itinerarios `Mi Viaje 2026` antiguos, marcados como `deleted_at`.

## Itinerarios detectados (mismo titulo)
- Activo: `b1a7eeea-3625-4ec6-a411-63731c97bda2` (`deleted_at = null`)
- Antiguo: `2651272f-bcb2-48b4-b3d6-77b775ee9d5f` (`deleted_at = 2026-01-25 19:44:34.930914+00`)
- Antiguo: `de92fd9c-f39d-4ade-9ae8-c485e4e8a4c3` (`deleted_at = 2026-01-25 19:44:34.930914+00`)

## Conteos
- `schedule_items` total en DB: `310`
- `schedule_items` del itinerario activo: `0`
- `schedule_items` de itinerario antiguo `de92fd9c-f39d-4ade-9ae8-c485e4e8a4c3`: `148`
- `schedule_items` de itinerario antiguo `2651272f-bcb2-48b4-b3d6-77b775ee9d5f`: `148`
- `orphan_schedule_items` (sin day_id valido): `0`

## Copia de seguridad creada
Se aplico migracion: `backup_mi_viaje_2026_snapshot_20260306`

Tablas backup creadas:
- `public.backup_itineraries_20260306` (3 filas)
- `public.backup_days_20260306` (69 filas)
- `public.backup_schedule_items_20260306` (296 filas)
- `public.backup_day_notes_20260306`
- `public.backup_schedule_item_tags_20260306`

## Por que no se muestra en el itinerario
El frontend carga actividades con esta relacion:
- `itineraries (activo)` -> `days (de ese itinerario)` -> `schedule_items` por `day_id`.

Como los `day_id` del itinerario activo no tienen filas en `schedule_items`, la UI no tiene horarios que renderizar.
No es un problema visual en esta instancia; es un desacople de datos entre itinerario activo y antiguos.
