const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputSvg = path.resolve(__dirname, '../src/assets/routeit-icon.svg');
const resBase = path.resolve(__dirname, '../android/app/src/main/res');

const sizes = [
  { folder: 'mipmap-ldpi', legacy: 36, adaptive: 81 },
  { folder: 'mipmap-mdpi', legacy: 48, adaptive: 108 },
  { folder: 'mipmap-hdpi', legacy: 72, adaptive: 162 },
  { folder: 'mipmap-xhdpi', legacy: 96, adaptive: 216 },
  { folder: 'mipmap-xxhdpi', legacy: 144, adaptive: 324 },
  { folder: 'mipmap-xxxhdpi', legacy: 192, adaptive: 432 },
];

const backgroundColor = { r: 91, g: 45, b: 216, alpha: 1 };

const renderSvg = async (size, outputPath) => {
  await sharp(inputSvg)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);
};

const renderSolidBackground = async (size, outputPath) => {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: backgroundColor,
    },
  })
    .png()
    .toFile(outputPath);
};

async function generate() {
  if (!fs.existsSync(inputSvg)) {
    console.error('Input SVG not found:', inputSvg);
    process.exit(1);
  }

  for (const s of sizes) {
    const outDir = path.join(resBase, s.folder);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const legacyPath = path.join(outDir, 'ic_launcher.png');
    const roundPath = path.join(outDir, 'ic_launcher_round.png');
    const foregroundPath = path.join(outDir, 'ic_launcher_foreground.png');
    const backgroundPath = path.join(outDir, 'ic_launcher_background.png');

    console.log(`Generating ${legacyPath} (${s.legacy}x${s.legacy})`);
    await renderSvg(s.legacy, legacyPath);

    console.log(`Generating ${roundPath} (${s.legacy}x${s.legacy})`);
    await renderSvg(s.legacy, roundPath);

    console.log(`Generating ${foregroundPath} (${s.adaptive}x${s.adaptive})`);
    await renderSvg(s.adaptive, foregroundPath);

    console.log(`Generating ${backgroundPath} (${s.adaptive}x${s.adaptive})`);
    await renderSolidBackground(s.adaptive, backgroundPath);
  }

  // Generate Play Store icon 512x512
  const playPath = path.join(resBase, '..', '..', '..', '..', 'play-icon-512.png');
  try {
    console.log('Generating play-icon-512.png');
    await sharp(inputSvg).resize(512, 512).png().toFile(path.resolve(__dirname, '..', 'play-icon-512.png'));
  } catch (e) {
    console.warn('Could not write play icon:', e.message);
  }

  console.log('Done.');
}

generate().catch(err => { console.error(err); process.exit(1); });
