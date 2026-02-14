# Capacitor Setup (RouteIt)

## Current status
- Android platform created in `android/`.
- iOS platform created in `ios/`.
- Web assets synced with `npx cap sync`.
- Native deep links connected (`com.routeit.app://...`) to React routes.
- Native push integrated with Capacitor plugins:
  - `@capacitor/push-notifications`
  - `@capacitor/local-notifications`
  - `@capacitor/app`
- Push subscriptions persisted in Supabase (`push_subscriptions`).

## Recommended development flow
1. Build web app:
   - `npm run cap:build`
2. Sync native projects:
   - `npm run cap:sync`
3. Open native project:
   - Android: `npm run cap:android`
   - iOS: `npm run cap:ios`

## Available scripts
- `npm run cap:add:android`
- `npm run cap:add:ios`
- `npm run cap:build`
- `npm run cap:build:staging`
- `npm run cap:build:production`
- `npm run cap:copy`
- `npm run cap:sync`
- `npm run cap:sync:staging`
- `npm run cap:sync:production`
- `npm run cap:android`
- `npm run cap:ios`
- `npm run cap:run:android`
- `npm run cap:run:ios`

## Platform requirements

### Android
- Android Studio
- Android SDK + emulator or physical device
- Java 21 (recommended for modern toolchains)

### iOS
- macOS + Xcode (required)
- Apple Developer account for TestFlight/App Store distribution

## Important notes
- On Windows you can maintain and sync `ios/`, but iOS build/sign requires macOS.
- After changing native plugins, run `npm run cap:sync`.
- Before production push usage, apply Supabase migrations that create `push_subscriptions`.
- Remote push on Android/iOS still requires environment-specific FCM/APNs credentials.

## Mobile environment strategy
- Included templates:
  - `.env.example` (development)
  - `.env.staging.example`
  - `.env.production.example`
- Recommended flow:
  1. Create local env files (`.env.staging`, `.env.production`) from templates.
  2. Fill `VITE_*` vars per environment (Supabase, Sentry, VAPID, etc).
  3. Build and sync native with the target environment:
     - Staging: `npm run cap:sync:staging`
     - Production: `npm run cap:sync:production`
- Convention:
  - `VITE_APP_ENV=development|staging|production` for telemetry/log traceability.
