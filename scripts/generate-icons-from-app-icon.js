/**
 * Generate PWA icons from app_icon.png
 * Run with: node scripts/generate-icons-from-app-icon.js
 * 
 * Requires: npm install sharp --save-dev
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('Error: sharp is not installed. Please run: npm install sharp --save-dev');
  process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');
const sourceIcon = path.join(iconsDir, 'app_icon.png');

// Check if source icon exists
if (!fs.existsSync(sourceIcon)) {
  console.error(`Error: Source icon not found at ${sourceIcon}`);
  process.exit(1);
}

console.log('Generating PWA icons from app_icon.png...');

// Generate icons for each size
Promise.all(
  sizes.map((size) => {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    return sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 29, g: 130, b: 142, alpha: 1 } // #1D828E theme color
      })
      .png()
      .toFile(outputPath)
      .then(() => {
        console.log(`✓ Generated icon-${size}x${size}.png`);
      })
      .catch((error) => {
        console.error(`✗ Error generating icon-${size}x${size}.png:`, error.message);
      });
  })
)
  .then(() => {
    console.log('\n✅ All icons generated successfully!');
    console.log(`Icons are located in: ${iconsDir}`);
  })
  .catch((error) => {
    console.error('\n❌ Error generating icons:', error);
    process.exit(1);
  });

