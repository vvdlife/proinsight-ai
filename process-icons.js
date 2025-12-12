import { Jimp } from 'jimp';
import path from 'path';

const ICON_PATH = path.join(process.cwd(), 'public', 'favicon.png');
const OUTPUT_DIR = path.join(process.cwd(), 'public');

async function processIcons() {
  try {
    console.log('Reading icon from:', ICON_PATH);
    const image = await Jimp.read(ICON_PATH);

    // 1. Remove White Background
    // Iterate over all pixels
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    // Threshold for "white"
    const threshold = 240; 

    image.scan(0, 0, width, height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];

      // If pixel is near white, make it transparent
      if (red > threshold && green > threshold && blue > threshold) {
        this.bitmap.data[idx + 3] = 0; // Alpha = 0 (Transparent)
      }
    });

    console.log('Background removed.');
    
    // Save the transparent favicon (overwrite)
    await image.write(path.join(OUTPUT_DIR, 'favicon.png'));
    console.log('Saved transparent favicon.png');

    // 2. Generate Sizes
    const sizes = [48, 96, 144, 192, 512];
    
    for (const size of sizes) {
        const resized = image.clone().resize({ w: size, h: size });
        await resized.write(path.join(OUTPUT_DIR, `icon-${size}.png`));
        console.log(`Generated icon-${size}.png`);
    }

    console.log('All icons generated successfully!');

  } catch (error) {
    console.error('Error processing icons:', error);
    process.exit(1);
  }
}

processIcons();
