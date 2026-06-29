// Script to generate app icons from SVG
// Run: node scripts/generate-icons.cjs
// Requires: npm install sharp png-to-ico

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    // Dynamic imports for ES modules
    const sharp = (await import('sharp')).default;
    const pngToIco = (await import('png-to-ico')).default;
    
    const svgPath = path.join(__dirname, '..', 'favicon.svg');
    const fileIconPath = path.join(__dirname, '..', 'file-icon.svg');
    const buildDir = path.join(__dirname, '..', 'build');
    
    // Create build directory if it doesn't exist
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Generate PNG at different sizes for app icon
    const sizes = [16, 32, 48, 64, 128, 256, 512];
    
    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(buildDir, `icon-${size}.png`));
      console.log(`Generated icon-${size}.png`);
    }
    
    // Generate main icon.png (256x256)
    await sharp(svgBuffer)
      .resize(256, 256)
      .png()
      .toFile(path.join(buildDir, 'icon.png'));
    console.log('Generated icon.png (256x256)');
    
    // Generate ICO file (Windows) for app
    const icoSizes = [16, 32, 48, 256];
    const pngBuffers = [];
    
    for (const size of icoSizes) {
      const buffer = await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer();
      pngBuffers.push(buffer);
    }
    
    const icoBuffer = await pngToIco(pngBuffers);
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
    console.log('Generated icon.ico (app icon)');
    
    // Generate file association icon (.pppro files)
    if (fs.existsSync(fileIconPath)) {
      const fileIconBuffer = fs.readFileSync(fileIconPath);
      
      // Generate file icon PNG
      await sharp(fileIconBuffer)
        .resize(256, 256)
        .png()
        .toFile(path.join(buildDir, 'file-icon.png'));
      console.log('Generated file-icon.png');
      
      // Generate file icon ICO
      const fileIcoBuffers = [];
      for (const size of icoSizes) {
        const buffer = await sharp(fileIconBuffer)
          .resize(size, size)
          .png()
          .toBuffer();
        fileIcoBuffers.push(buffer);
      }
      
      const fileIcoBuffer = await pngToIco(fileIcoBuffers);
      fs.writeFileSync(path.join(buildDir, 'file-icon.ico'), fileIcoBuffer);
      console.log('Generated file-icon.ico (for .pppro files)');
    }
    
    console.log('\nAll icons generated successfully in /build folder!');
    
  } catch (error) {
    console.error('Error generating icons:', error.message);
    console.log('\nTo install required packages, run:');
    console.log('npm install sharp png-to-ico');
  }
}

generateIcons();
