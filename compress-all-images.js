const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const mediaDir = path.join(__dirname, 'public', 'content', 'media');
const backupDir = path.join(__dirname, 'image-backups');

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('📦 Created backup directory\n');
}

async function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function compressImage(inputPath, outputPath, quality = 90) {
  try {
    await sharp(inputPath)
      .png({ 
        quality: quality,
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`Error compressing ${path.basename(inputPath)}:`, error.message);
    return false;
  }
}

async function compressAllImages() {
  console.log('🚀 Starting image compression at 90% quality...\n');
  
  // Get all PNG files
  const files = fs.readdirSync(mediaDir)
    .filter(file => file.toLowerCase().endsWith('.png'))
    .sort();
  
  console.log(`Found ${files.length} PNG files to compress\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  let processed = 0;
  let errors = 0;
  
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const inputPath = path.join(mediaDir, filename);
    const backupPath = path.join(backupDir, filename);
    const tempPath = path.join(mediaDir, `temp-${filename}`);
    
    try {
      // Get original size
      const originalSize = await getFileSize(inputPath);
      totalOriginalSize += originalSize;
      
      // Create backup
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(inputPath, backupPath);
      }
      
      // Compress to temp file
      const success = await compressImage(inputPath, tempPath, 90);
      
      if (success) {
        const compressedSize = await getFileSize(tempPath);
        const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        
        // Replace original with compressed
        fs.renameSync(tempPath, inputPath);
        
        totalCompressedSize += compressedSize;
        processed++;
        
        // Show progress every 10 files or for first few
        if (processed % 10 === 0 || processed <= 5) {
          console.log(`[${processed}/${files.length}] ${filename}: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${reduction}% reduction)`);
        }
      } else {
        errors++;
        // Clean up temp file if it exists
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    } catch (error) {
      console.error(`Error processing ${filename}:`, error.message);
      errors++;
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Compression complete!\n');
  console.log(`📊 Results:`);
  console.log(`   Files processed: ${processed}/${files.length}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Original total: ${formatBytes(totalOriginalSize)}`);
  console.log(`   Compressed total: ${formatBytes(totalCompressedSize)}`);
  console.log(`   Space saved: ${formatBytes(totalOriginalSize - totalCompressedSize)}`);
  console.log(`   Average reduction: ${((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1)}%`);
  console.log(`\n📦 Original images backed up to: ${backupDir}/`);
  console.log('   (You can delete this folder after verifying the compressed images)');
}

compressAllImages().catch(console.error);

