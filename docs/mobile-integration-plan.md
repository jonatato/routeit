# Mobile Integration Plan (RouteIt)

## Progress update (2026-02-11)
- Completed:
  - `MOB-01` Setup Android/iOS projects and basic sync/build validation.
  - `MOB-02` Mobile env strategy and mode-based build/sync scripts.
  - `MOB-03` Deep-link routing + auth callback handling.
  - `MOB-04` Session restore on native lifecycle + QA checklist.
  - `MOB-05` Capacitor Push Notifications integration baseline.
  - `MOB-06` Notification intent routing to app screens.
- Partially completed:
  - `MOB-09` PDF export moved to lazy import to reduce startup payload.
- Pending:
  - `MOB-07` to `MOB-12`.

## Decision
Use **Capacitor** as the primary mobile strategy for the next 2 releases.

## Why
- Current codebase already includes Capacitor dependencies and config.
- Reuses existing React + Vite app with minimal rewrite.
- Fastest path to TestFlight/Play Internal Testing.
- Lower risk while we still have web debt (lint, type quality, offline sync).

## Alternatives Considered

### React Native
- Pros:
  - Better native rendering and performance for complex list/gesture screens.
  - Strong native ecosystem.
- Cons:
  - Requires large rewrite of UI, navigation, and platform integrations.
  - Higher delivery time and maintenance cost.
- Use it later only if metrics show webview limits (render jank, memory, startup) that cannot be fixed with Capacitor.

### Power Apps
- Pros:
  - Fast internal app prototyping.
- Cons:
  - Poor fit for RouteIt product UX and custom interactions.
  - Lock-in and licensing constraints.
  - Limited control over product differentiation.

## Target Architecture (Capacitor)
- Shared app shell: existing React routes and services.
- Native bridge via Capacitor plugins:
  - Push notifications
  - Deep links / universal links
  - Native share
  - Camera/photos (if needed for memories/documents)
  - Secure storage for sensitive tokens/preferences
- Backend remains Supabase (Auth, DB, Edge Functions, Realtime).

## Execution Plan

### Phase M1: Foundation (1 week)
- Upgrade/verify Capacitor platform projects (`android`, `ios`).
- Confirm `npm run cap:build` and `npm run cap:sync` in CI-local checklist.
- Add environment strategy for mobile builds (dev/staging/prod).
- Deliverable:
  - Android/iOS projects booting and loading current app.

### Phase M2: Auth + Navigation (1 week)
- Add deep link callbacks for auth reset/magic links.
- Ensure session restore and token refresh on app cold start.
- Define app URL scheme and universal links.
- Deliverable:
  - Login/logout/reset flow verified on device.

### Phase M3: Notifications (1 week)
- Move from web push assumptions to Capacitor Push Notifications plugin.
- Map notification payloads to route intents (`/app/today`, split events, etc.).
- Add notification permission UX and fallback behavior.
- Deliverable:
  - Push received in foreground/background and click opens correct screen.

### Phase M4: Offline Reliability (1-2 weeks)
- Complete pending sync queue (`create/update/delete`) with retries + backoff.
- Add conflict resolution policy (`updated_at` wins + user prompt on hard conflicts).
- Persist critical itineraries and split data.
- Deliverable:
  - Full offline edit + online reconciliation tested on airplane mode.

### Phase M5: Performance + Store Readiness (1 week)
- Reduce startup JS and defer heavy features (PDF/export/maps advanced).
- Optimize media assets and large lottie/json payloads.
- Add crash/error telemetry and release health dashboards.
- Deliverable:
  - Startup and interaction metrics within target budgets.

### Phase M6: Release (1 week)
- Internal beta (TestFlight + Play Internal).
- QA matrix by OS/version/device tier.
- Prepare store metadata, privacy labels, permissions rationale.
- Deliverable:
  - Candidate build ready for public release.

## Work Items (Ticket-Ready)
- `MOB-01` Setup Android/iOS projects, verify debug builds.
- `MOB-02` Define env strategy and secrets injection for mobile.
- `MOB-03` Implement deep-link routing + auth callback handling.
- `MOB-04` Add session restore test cases for cold/warm start.
- `MOB-05` Integrate Capacitor Push Notifications end-to-end.
- `MOB-06` Implement notification intent router.
- `MOB-07` Complete offline sync engine and retry policy.
- `MOB-08` Add conflict resolution UX for sync collisions.
- `MOB-09` Defer PDF/maps heavy modules for faster startup.
- `MOB-10` Add crash analytics dashboards and alerting.
- `MOB-11` Build QA test matrix and run regression on real devices.
- `MOB-12` Prepare release checklist and store submission artifacts.

## Exit Criteria
- Auth, deep links, push, and offline sync pass device QA.
- No blocker crashes in beta for 7 consecutive days.
- Startup time and memory usage stable across low/mid-tier devices.
- Release checklist completed for iOS and Android.
