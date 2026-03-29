import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  try {
    console.log('Fetching new logo image...');
    const res = await fetch('https://sf-static.upanhlaylink.com/img/image_20260329e653d2cb7260ff048a889fe07a0ebc3f.jpg');
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    
    const arrayBuffer = await res.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Save the source image
    fs.writeFileSync(path.join(__dirname, 'public', 'source-icon.jpg'), imageBuffer);

    await sharp(imageBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(__dirname, 'public', 'app-icon-v3-192x192.png'));
    
    console.log('Generated app-icon-v3-192x192.png');

    await sharp(imageBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, 'public', 'app-icon-v3-512x512.png'));
      
    console.log('Generated app-icon-v3-512x512.png');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
