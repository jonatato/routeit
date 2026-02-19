import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import AdmZip from 'adm-zip';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const args = process.argv.slice(2);

const getArg = (name) => {
  const prefixed = `--${name}=`;
  const entry = args.find(value => value.startsWith(prefixed));
  if (entry) return entry.slice(prefixed.length);

  const index = args.findIndex(value => value === `--${name}`);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  return undefined;
};

const hasFlag = (name) => args.includes(`--${name}`);

const printHelp = () => {
  console.log(`
RouteIt OTA Self-Hosted Release

Uso:
  npm run ota:release -- --bundle=1.0.1 [opciones]
  npm run ota:release -- --major=1 --minor=0 --patch=1 [opciones]
  npm run ota:release -- --bump=patch [opciones]

Opciones:
  --bundle <version>          Versión OTA explícita (ej: 1.0.1)
  --major <n>                 Semver major (usar junto a --minor y --patch)
  --minor <n>                 Semver minor (usar junto a --major y --patch)
  --patch <n>                 Semver patch (usar junto a --major y --minor)
  --bump <tipo>               Incremento automático: major | minor | patch
  --channel <channel>         production | beta (default: production)
  --platform <platform>       all | android | ios (default: all)
  --rollout <1-100>           % rollout gradual (default: 100)
  --mandatory                 Marca actualización como obligatoria
  --native-min <version>      Versión nativa mínima requerida
  --native-max <version>      Versión nativa máxima permitida
  --metadata <json>           JSON opcional de metadatos
  --skip-build                Omite build:production
  --help                      Mostrar ayuda

Variables de entorno requeridas:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  OTA_ADMIN_TOKEN

Variables opcionales:
  OTA_CHANNEL                 Canal por defecto si no pasas --channel
  OTA_BUNDLE_BUCKET           Bucket (default: ota-bundles)
`);
};

if (hasFlag('help')) {
  printHelp();
  process.exit(0);
}

const bundleArg = getArg('bundle');
const majorArg = getArg('major');
const minorArg = getArg('minor');
const patchArg = getArg('patch');
const bumpArg = getArg('bump');

const channel = getArg('channel') ?? process.env.OTA_CHANNEL ?? 'production';
const platform = getArg('platform') ?? 'all';
const rolloutPercent = Number.parseInt(getArg('rollout') ?? '100', 10);
const mandatory = hasFlag('mandatory');
const nativeMinVersion = getArg('native-min');
const nativeMaxVersion = getArg('native-max');
const metadataRaw = getArg('metadata');
const skipBuild = hasFlag('skip-build');

const isValidNonNegativeInt = (value) => /^\d+$/.test(String(value));
const isValidSemver = (value) => /^\d+\.\d+\.\d+$/.test(value);

const parseSemver = (value) => {
  const [major, minor, patch] = value.split('.').map(part => Number.parseInt(part, 10));
  return { major, minor, patch };
};

const bumpSemver = (value, bumpType) => {
  const current = parseSemver(value);
  if (bumpType === 'major') return `${current.major + 1}.0.0`;
  if (bumpType === 'minor') return `${current.major}.${current.minor + 1}.0`;
  return `${current.major}.${current.minor}.${current.patch + 1}`;
};

if (!['production', 'beta'].includes(channel)) {
  console.error('❌ --channel debe ser production o beta');
  process.exit(1);
}

if (!['all', 'android', 'ios'].includes(platform)) {
  console.error('❌ --platform debe ser all, android o ios');
  process.exit(1);
}

if (bumpArg && !['major', 'minor', 'patch'].includes(bumpArg)) {
  console.error('❌ --bump debe ser major, minor o patch');
  process.exit(1);
}

if (!Number.isFinite(rolloutPercent) || rolloutPercent < 1 || rolloutPercent > 100) {
  console.error('❌ --rollout debe estar entre 1 y 100');
  process.exit(1);
}

let metadata = {};
if (metadataRaw) {
  try {
    metadata = JSON.parse(metadataRaw);
  } catch {
    console.error('❌ --metadata no es JSON válido');
    process.exit(1);
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const otaAdminToken = process.env.OTA_ADMIN_TOKEN;
const bucket = process.env.OTA_BUNDLE_BUCKET ?? 'ota-bundles';

if (!supabaseUrl || !supabaseAnonKey || !otaAdminToken) {
  console.error('❌ Faltan variables de entorno requeridas: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, OTA_ADMIN_TOKEN');
  process.exit(1);
}

let bundleVersion = bundleArg;

if (!bundleVersion && majorArg !== undefined && minorArg !== undefined && patchArg !== undefined) {
  if (!isValidNonNegativeInt(majorArg) || !isValidNonNegativeInt(minorArg) || !isValidNonNegativeInt(patchArg)) {
    console.error('❌ --major, --minor y --patch deben ser enteros >= 0');
    process.exit(1);
  }
  bundleVersion = `${majorArg}.${minorArg}.${patchArg}`;
}

if (!bundleVersion && bumpArg) {
  const latestResponse = await fetch(`${supabaseUrl}/functions/v1/ota-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ota-admin-token': otaAdminToken,
    },
    body: JSON.stringify({
      action: 'latestVersion',
      channel,
      platform,
    }),
  });

  const latestPayload = await latestResponse.json().catch(() => ({}));
  if (!latestResponse.ok) {
    console.error('❌ Error obteniendo versión actual para bump:', latestPayload);
    process.exit(1);
  }

  const latestVersion = typeof latestPayload?.latestVersion === 'string' ? latestPayload.latestVersion : '0.0.0';
  if (!isValidSemver(latestVersion)) {
    console.error(`❌ latestVersion inválida en servidor: ${latestVersion}`);
    process.exit(1);
  }

  bundleVersion = bumpSemver(latestVersion, bumpArg);
  console.log(`🔢 Versión calculada automáticamente: ${latestVersion} -> ${bundleVersion}`);
}

if (!bundleVersion) {
  console.error('❌ Debes indicar versión con --bundle o con --major/--minor/--patch o usar --bump');
  printHelp();
  process.exit(1);
}

if (!isValidSemver(bundleVersion)) {
  console.error(`❌ Versión inválida: ${bundleVersion}. Formato esperado: x.y.z`);
  process.exit(1);
}

if (!skipBuild) {
  console.log('🏗️  Build production...');
  const npmExecPath = process.env.npm_execpath;
  const buildCommand = npmExecPath ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
  const buildArgs = npmExecPath ? [npmExecPath, 'run', 'build:production'] : ['run', 'build:production'];

  const buildResult = spawnSync(buildCommand, buildArgs, {
    stdio: 'inherit',
    shell: false,
  });

  if (buildResult.error) {
    console.error('❌ Error ejecutando build:', buildResult.error.message);
    process.exit(1);
  }

  if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1);
  }
}

const distPath = path.resolve('dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ No existe dist/. Ejecuta build primero.');
  process.exit(1);
}

const otaDir = path.resolve('.ota');
fs.mkdirSync(otaDir, { recursive: true });
const zipFileName = `dist-${bundleVersion}.zip`;
const zipPath = path.join(otaDir, zipFileName);

console.log('📦 Generando ZIP...');
const zip = new AdmZip();
zip.addLocalFolder(distPath);
zip.writeZip(zipPath);

const fileBuffer = fs.readFileSync(zipPath);
const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
let filePath = `${channel}/${bundleVersion}/dist.zip`;

console.log(`☁️  Subiendo ZIP a storage://${bucket}/${filePath}`);
const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

const uploadUrlResponse = await fetch(`${supabaseUrl}/functions/v1/ota-update`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-ota-admin-token': otaAdminToken,
  },
  body: JSON.stringify({
    action: 'createUploadUrl',
    channel,
    bundleVersion,
  }),
});

const uploadUrlPayload = await uploadUrlResponse.json().catch(() => ({}));

if (!uploadUrlResponse.ok || !uploadUrlPayload?.upload?.token || !uploadUrlPayload?.upload?.filePath) {
  console.error('❌ Error generando signed upload URL:', uploadUrlPayload);
  if (uploadUrlResponse.status === 401) {
    console.error('ℹ️  OTA_ADMIN_TOKEN no coincide o no está configurado en la Edge Function ota-update.');
    console.error('ℹ️  Configura el mismo valor en tu .env local y en los secrets de Supabase para ota-update.');
  }
  process.exit(1);
}

filePath = uploadUrlPayload.upload.filePath;

const upload = await supabase.storage
  .from(uploadUrlPayload.upload.bucket ?? bucket)
  .uploadToSignedUrl(filePath, uploadUrlPayload.upload.token, fileBuffer, {
    contentType: 'application/zip',
    upsert: true,
  });

if (upload.error) {
  console.error('❌ Error subiendo ZIP:', upload.error.message);
  process.exit(1);
}

console.log('📝 Registrando release en ota-update...');
const publishResponse = await fetch(`${supabaseUrl}/functions/v1/ota-update`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-ota-admin-token': otaAdminToken,
  },
  body: JSON.stringify({
    action: 'publish',
    channel,
    platform,
    bundleVersion,
    filePath,
    checksum,
    mandatory,
    rolloutPercent,
    nativeMinVersion: nativeMinVersion ?? null,
    nativeMaxVersion: nativeMaxVersion ?? null,
    metadata,
  }),
});

const publishPayload = await publishResponse.json().catch(() => ({}));

if (!publishResponse.ok) {
  console.error('❌ Error publicando release:', publishPayload);
  if (publishResponse.status === 401) {
    console.error('ℹ️  Revisa que OTA_ADMIN_TOKEN esté configurado como secret en la Edge Function ota-update y en tu .env local.');
  }
  process.exit(1);
}

console.log('✅ OTA release publicada correctamente');
console.log(JSON.stringify({
  channel,
  platform,
  bundleVersion,
  filePath,
  checksum,
  release: publishPayload.release ?? null,
}, null, 2));
