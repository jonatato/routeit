# Mobile Session QA (MOB-04)

## Scope
Validate auth session restore/refresh behavior on native app lifecycle (Android and iOS).

## Preconditions
- App built and synced (`npm run cap:sync:staging` or `npm run cap:sync:production`).
- User can log in with email/password.
- Network available for refresh calls.

## Test cases
1. Cold start with valid session
   - Login and close app completely.
   - Reopen app.
   - Expected: user lands in authenticated flow without forced logout.
2. Warm resume with short-lived session
   - Login, send app to background, wait near token expiry window.
   - Return app to foreground.
   - Expected: session refresh happens and user remains authenticated.
3. Warm resume offline
   - Login, disable network, send app to background, reopen.
   - Expected: last session state is preserved; app does not crash.
4. Expired refresh token
   - Invalidate session server-side, reopen app.
   - Expected: app redirects to `/login`.
5. Deep link while unauthenticated
   - Open `com.routeit.app://app/today`.
   - Expected: auth guard redirects to `/login`.
6. Deep link while authenticated
   - Open `com.routeit.app://app/today`.
   - Expected: app opens the requested route.

## Evidence to capture
- Device model and OS version.
- App version/build number.
- Timestamp, test case id, pass/fail, notes.
- Optional: console logs for auth refresh events.
