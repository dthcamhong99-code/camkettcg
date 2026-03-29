import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  try {
    console.log('Generating icons from icon.svg...');
    const svgBuffer = fs.readFileSync(path.join(__dirname, 'public', 'icon.svg'));

    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(__dirname, 'public', 'app-icon-v4-192x192.png'));
    
    console.log('Generated app-icon-v4-192x192.png');

    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, 'public', 'app-icon-v4-512x512.png'));
      
    console.log('Generated app-icon-v4-512x512.png');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
