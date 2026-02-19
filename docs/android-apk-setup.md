# Android APK Setup

## 1) Prerrequisitos
- Android Studio (ultimo estable)
- JDK 17
- Variables de entorno en Windows:
  - `JAVA_HOME` apuntando al JDK 17
  - `ANDROID_HOME` (opcional si usas Android Studio, pero recomendado)

## 2) Firebase
- Coloca `google-services.json` en:
  - `android/app/google-services.json`
- El package id debe coincidir con:
  - `com.routeit.routeit`

## 3) Firma release (Play Store)
- Copia `android/key.properties.example` a `android/key.properties`
- Rellena valores reales:
  - `storeFile`
  - `storePassword`
  - `keyAlias`
  - `keyPassword`
- Guarda el keystore fuera del repo o en `android/keystores/` (gitignored).

## 4) Comandos de build
- APK debug:
  - `npm run android:apk:debug`
- APK release:
  - `npm run android:apk:release`
- AAB release (recomendado para Play Store):
  - `npm run android:aab:release`

## 5) Salidas
- APK debug:
  - `android/app/build/outputs/apk/debug/app-debug.apk`
- APK release:
  - `android/app/build/outputs/apk/release/app-release.apk`
- AAB release:
  - `android/app/build/outputs/bundle/release/app-release.aab`
