import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, 'public', 'village-background.jpg');
const outputPath = path.join(__dirname, 'public', 'village-background-optimized.jpg');
const webpPath = path.join(__dirname, 'public', 'village-background.webp');

async function optimizeImage() {
  try {
    console.log('🎨 Optimiere Dorf-Hintergrundbild...');
    
    // JPG mit höherer Qualität und Optimierung
    await sharp(inputPath)
      .resize(1920, 1080, { 
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85, progressive: true, mozjpeg: true })
      .toFile(outputPath);
    
    console.log('✅ JPG-Version optimiert');
    
    // WebP für moderne Browser (20% kleiner)
    await sharp(inputPath)
      .resize(1920, 1080, { 
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true 
      })
      .webp({ quality: 85 })
      .toFile(webpPath);
    
    console.log('✅ WebP-Version erstellt');
    console.log('📊 Bilder optimiert und bereit!');
    
  } catch (error) {
    console.error('❌ Fehler beim Optimieren:', error.message);
    process.exit(1);
  }
}

optimizeImage();
