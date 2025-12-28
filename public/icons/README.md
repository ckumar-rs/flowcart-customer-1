# PWA Icons

This directory should contain the following icon files for PWA support:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels (required)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (required)

## Generating Icons

You can generate these icons from a single 512x512 source image using online tools like:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/

Or use ImageMagick/GraphicsMagick:
```bash
# Create icons directory
mkdir -p public/icons

# Generate icons from a 512x512 source image
convert source-icon.png -resize 72x72 public/icons/icon-72x72.png
convert source-icon.png -resize 96x96 public/icons/icon-96x96.png
convert source-icon.png -resize 128x128 public/icons/icon-128x128.png
convert source-icon.png -resize 144x144 public/icons/icon-144x144.png
convert source-icon.png -resize 152x152 public/icons/icon-152x152.png
convert source-icon.png -resize 192x192 public/icons/icon-192x192.png
convert source-icon.png -resize 384x384 public/icons/icon-384x384.png
cp source-icon.png public/icons/icon-512x512.png
```

## Temporary Placeholder

For development, you can create simple colored squares as placeholders. The app will work without icons, but they're recommended for production.

