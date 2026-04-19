const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.error("❌ 'sharp' not found. Run: npm install sharp");
    process.exit(1);
}

// Configuration
const TARGET_DIR = path.join(__dirname, 'my lab website');
const IMG_QUALITY = 90; // Premium quality to avoid blur
const VID_CRF = 26;     // High-fidelity video compression

function getFilesRecursive(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFilesRecursive(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    });
    return fileList;
}

async function optimize() {
    console.log("🚀 STARTING INDUSTRIAL OPTIMIZATION SCAN...");
    const allFiles = getFilesRecursive(TARGET_DIR);
    
    for (const filePath of allFiles) {
        const ext = path.extname(filePath).toLowerCase();
        const dir = path.dirname(filePath);
        const name = path.parse(filePath).name;

        // Image Pass (Skip if already webp)
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            const outPath = path.join(dir, `${name}.webp`);
            if (!fs.existsSync(outPath)) {
                console.log(`📸 Processing Image: ${path.relative(TARGET_DIR, filePath)}`);
                await sharp(filePath)
                    .webp({ quality: IMG_QUALITY, lossless: false, smartSubsample: true })
                    .toFile(outPath)
                    .catch(e => console.error(`   ❌ Failed: ${name}`, e));
            }
        }

        // Video Pass (Skip if already optimized)
        if (ext === '.mp4' && !name.endsWith('_opt')) {
            const outPath = path.join(dir, `${name}_opt.mp4`);
            if (!fs.existsSync(outPath)) {
                console.log(`🎬 Processing Video: ${path.relative(TARGET_DIR, filePath)}`);
                try {
                    // Slower preset for maximum quality retention
                    execSync(`ffmpeg -i "${filePath}" -vcodec libx264 -crf ${VID_CRF} -preset slower -an "${outPath}" -y`, { stdio: 'ignore' });
                    console.log(`   ✅ Success: ${name}_opt.mp4`);
                } catch (e) {
                    console.warn(`   ⚠️ ffmpeg error on ${name}. Ensure ffmpeg is in PATH.`);
                }
            }
        }
    }
    console.log("✅ OPTIMIZATION COMPLETE.");
}

optimize();
