alter table public.schedule_items
  add column if not exists related_document_id uuid references public.itinerary_documents(id) on delete set null;

create index if not exists idx_schedule_items_related_document_id
  on public.schedule_items (related_document_id);