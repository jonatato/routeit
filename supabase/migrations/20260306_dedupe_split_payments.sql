-- Remove likely accidental duplicate payments in a short time window.
-- Criteria: same group, payer, payee, rounded amount, normalized note,
-- and created within 15 seconds from the previous matching payment.

with ordered as (
  select
    id,
    group_id,
    payer_id,
    payee_id,
    round(amount::numeric, 2) as amount_norm,
    coalesce(nullif(btrim(note), ''), '<null>') as note_norm,
    created_at,
    lag(created_at) over (
      partition by
        group_id,
        payer_id,
        payee_id,
        round(amount::numeric, 2),
        coalesce(nullif(btrim(note), ''), '<null>')
      order by created_at asc, id asc
    ) as previous_created_at
  from public.split_payments
), duplicates as (
  select id
  from ordered
  where previous_created_at is not null
    and created_at - previous_created_at <= interval '15 seconds'
)
delete from public.split_payments
where id in (select id from duplicates);
