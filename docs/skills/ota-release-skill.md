# Skill: OTA release (self-hosted)

## Objetivo
Publicar una actualización OTA de RouteIt usando el script oficial del proyecto y dejar un plan claro de verificación/rollback.

## Prerrequisitos
- Variables en `.env`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `OTA_ADMIN_TOKEN`
  - `OTA_CHANNEL` (opcional, recomendado `production`)
  - `OTA_BUNDLE_BUCKET` (opcional, recomendado `ota-bundles`)
- Dependencias instaladas (`npm install`)

## Comando principal
Publicar con incremento automático patch en producción:

```bash
npm run ota:release -- --bump=patch --channel=production --platform=all
```

## Variantes útiles
- Versión explícita:

```bash
npm run ota:release -- --bundle=1.0.8 --channel=production --platform=all
```

- Rollout gradual 20%:

```bash
npm run ota:release -- --bump=patch --channel=production --platform=all --rollout=20
```

- OTA obligatoria:

```bash
npm run ota:release -- --bump=patch --channel=production --platform=all --mandatory
```

- Reutilizar un `dist` ya construido:

```bash
npm run ota:release -- --bump=patch --channel=production --platform=all --skip-build
```

## Qué hace el script
1. Calcula versión OTA (`--bundle` o `--bump`).
2. Ejecuta `build:production` (salvo `--skip-build`).
3. Comprime `dist` en `.ota/dist-<version>.zip`.
4. Sube el ZIP a Storage (`OTA_BUNDLE_BUCKET`).
5. Publica release en la Edge Function `ota-update`.

## Checklist post-release
- Confirmar salida `✅ OTA release publicada correctamente`.
- Guardar en notas de release:
  - `bundleVersion`
  - `filePath`
  - `checksum`
  - `release.id`
- Validar en dispositivo:
  - Abrir app
  - Verificar descarga OTA
  - Confirmar cambios visibles

## Rollback rápido
Re-publicar la última versión estable conocida (ejemplo):

```bash
npm run ota:release -- --bundle=1.0.6 --channel=production --platform=all
```

## Errores comunes
- `401` al publicar: `OTA_ADMIN_TOKEN` no coincide entre local y secret de Supabase.
- Falta de env vars: revisar `.env` y volver a ejecutar.
- Fallo en build: resolver errores del proyecto antes de OTA.

## Referencias
- Script fuente: `scripts/ota-release.mjs`
- Docs de producción: `docs/prod-checklist.md`