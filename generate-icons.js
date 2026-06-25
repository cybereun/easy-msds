import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  const svgPath = path.join(__dirname, 'public', 'favicon.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('favicon.svg not found');
    return;
  }

  const svgBuffer = fs.readFileSync(svgPath);

  await sharp(svgBuffer)
    .resize(192, 192)
    .toFile(path.join(__dirname, 'public', 'pwa-192x192.png'));

  await sharp(svgBuffer)
    .resize(512, 512)
    .toFile(path.join(__dirname, 'public', 'pwa-512x512.png'));

  await sharp(svgBuffer)
    .resize(180, 180)
    .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));

  console.log('Icons generated successfully!');
}

generateIcons();
