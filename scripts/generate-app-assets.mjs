/**
 * Genera icon/splash/favicon quadrati per Expo (SDK 54).
 * Richiede: npm install --save-dev sharp
 * Uso: npm run generate:assets
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const imagesDir = path.join(root, 'assets/images');
const logoPath = path.join(imagesDir, 'logo-scaramuzzo.png');

const BRAND_BG = '#140905';

async function compositeSquare({ size, logoMax, output, transparentBackground }) {
  const logoMeta = await sharp(logoPath).metadata();
  const scale = Math.min(logoMax / logoMeta.width, logoMax / logoMeta.height);
  const width = Math.round(logoMeta.width * scale);
  const height = Math.round(logoMeta.height * scale);

  const resizedLogo = await sharp(logoPath)
    .resize(width, height, { fit: 'inside' })
    .png()
    .toBuffer();

  const background = transparentBackground
    ? { r: 0, g: 0, b: 0, alpha: 0 }
    : BRAND_BG;

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resizedLogo, gravity: 'center' }])
    .png()
    .toFile(output);
}

async function main() {
  await compositeSquare({
    size: 1024,
    logoMax: 620,
    output: path.join(imagesDir, 'icon.png'),
    transparentBackground: false,
  });

  await compositeSquare({
    size: 1024,
    logoMax: 700,
    output: path.join(imagesDir, 'adaptive-icon.png'),
    transparentBackground: true,
  });

  await compositeSquare({
    size: 512,
    logoMax: 280,
    output: path.join(imagesDir, 'splash-icon.png'),
    transparentBackground: true,
  });

  await compositeSquare({
    size: 48,
    logoMax: 40,
    output: path.join(imagesDir, 'favicon.png'),
    transparentBackground: false,
  });

  console.log('Generated app assets in assets/images/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
