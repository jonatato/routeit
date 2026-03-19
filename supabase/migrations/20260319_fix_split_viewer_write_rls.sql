begin;

drop policy if exists split_groups_access on public.split_groups;
create policy split_groups_read_access
on public.split_groups
for select
using (public.has_itinerary_access(itinerary_id));

create policy split_groups_write_access
on public.split_groups
for all
using (public.has_itinerary_write_access(itinerary_id))
with check (public.has_itinerary_write_access(itinerary_id));

drop policy if exists split_members_access on public.split_members;
create policy split_members_read_access
on public.split_members
for select
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_members.group_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_members_write_access
on public.split_members
for all
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_members.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_members.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

drop policy if exists split_expenses_access on public.split_expenses;
create policy split_expenses_read_access
on public.split_expenses
for select
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_expenses.group_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_expenses_write_access
on public.split_expenses
for all
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_expenses.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_expenses.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

drop policy if exists split_shares_access on public.split_shares;
create policy split_shares_read_access
on public.split_shares
for select
using (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_shares.expense_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_shares_write_access
on public.split_shares
for all
using (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_shares.expense_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_shares.expense_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

drop policy if exists split_payments_access on public.split_payments;
create policy split_payments_read_access
on public.split_payments
for select
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_payments.group_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_payments_write_access
on public.split_payments
for all
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_payments.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_payments.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

drop policy if exists split_expense_categories_access on public.split_expense_categories;
create policy split_expense_categories_read_access
on public.split_expense_categories
for select
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_expense_categories.group_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_expense_categories_write_access
on public.split_expense_categories
for all
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_expense_categories.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_expense_categories.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

drop policy if exists split_expense_comments_access on public.split_expense_comments;
create policy split_expense_comments_read_access
on public.split_expense_comments
for select
using (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_comments.expense_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_expense_comments_write_access
on public.split_expense_comments
for all
using (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_comments.expense_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_comments.expense_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

drop policy if exists split_tags_access on public.split_tags;
create policy split_tags_read_access
on public.split_tags
for select
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_tags.group_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_tags_write_access
on public.split_tags
for all
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_tags.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_tags.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

drop policy if exists split_expense_tags_access on public.split_expense_tags;
create policy split_expense_tags_read_access
on public.split_expense_tags
for select
using (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_tags.expense_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_expense_tags_write_access
on public.split_expense_tags
for all
using (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_tags.expense_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_expenses se
    join public.split_groups sg on sg.id = se.group_id
    where se.id = split_expense_tags.expense_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

drop policy if exists split_notifications_access on public.split_notifications;
create policy split_notifications_read_access
on public.split_notifications
for select
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_notifications.group_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_notifications_write_access
on public.split_notifications
for all
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_notifications.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_notifications.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

drop policy if exists split_payment_reminders_access on public.split_payment_reminders;
create policy split_payment_reminders_read_access
on public.split_payment_reminders
for select
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_payment_reminders.group_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_payment_reminders_write_access
on public.split_payment_reminders
for all
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_payment_reminders.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_payment_reminders.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

drop policy if exists split_refunds_access on public.split_refunds;
create policy split_refunds_read_access
on public.split_refunds
for select
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_refunds.group_id
      and public.has_itinerary_access(sg.itinerary_id)
  )
);

create policy split_refunds_write_access
on public.split_refunds
for all
using (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_refunds.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
)
with check (
  exists (
    select 1
    from public.split_groups sg
    where sg.id = split_refunds.group_id
      and public.has_itinerary_write_access(sg.itinerary_id)
  )
);

commit;