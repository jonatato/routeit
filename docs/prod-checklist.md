# Production Checklist

## Blocking
- Verify Resend domain and set REMINDER_FROM_EMAIL to that domain.
- Remove REMINDER_TEST_RECIPIENT or leave empty for real sends.
- Create scheduled trigger for send-itinerary-reminders (daily).
- Confirm REMINDER_FROM_EMAIL and RESEND_API_KEY present in Supabase.

## App
- Validate /app/today route loads for logged-in users.
- Confirm in-app notification appears when trip start is today.
- Confirm notification click navigates to /app/today?itineraryId=...
- Verify Today view renders day schedule and empty state.

## Data
- Confirm itinerary_reminders table exists and unique index is in place.
- Confirm user_preferences.email_notifications is respected.
- Confirm bag_checklist_items and itinerary packing list populate email content.

## Observability
- Review edge function logs for send-itinerary-reminders.
- Add alert if function returns 500.

## Cleanup After Go-live
- Remove any test override usage (today query param) from docs/runbooks.
- Consider adding rate limits or batching if user volume grows.

## Nice-to-have
- Add a settings toggle in UI for email reminders.
- Add analytics event for Today view visits.
