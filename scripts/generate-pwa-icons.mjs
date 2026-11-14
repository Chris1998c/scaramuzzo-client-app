import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const input = join(root, 'assets/images/icon.png');
const output = join(root, 'public');
mkdirSync(output, { recursive: true });

for (const size of [180, 192, 512]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  await sharp(input).resize(size, size).png().toFile(join(output, name));
}
await sharp(input).resize(32, 32).png().toFile(join(output, 'favicon.png'));
