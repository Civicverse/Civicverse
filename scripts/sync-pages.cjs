const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'frontend', 'dist');
const rootAssetsDir = path.join(rootDir, 'assets');
const docsDir = path.join(rootDir, 'docs');
const docsAssetsDir = path.join(docsDir, 'assets');

if (!fs.existsSync(distDir)) {
  console.error('frontend/dist does not exist. Please run npm run build in frontend first.');
  process.exit(1);
}

// 1. Read dist files
const distFiles = fs.readdirSync(distDir);
const distAssets = fs.existsSync(path.join(distDir, 'assets')) 
  ? fs.readdirSync(path.join(distDir, 'assets')) 
  : [];

// Clean old assets from root assets/
if (fs.existsSync(rootAssetsDir)) {
  for (const f of fs.readdirSync(rootAssetsDir)) {
    if (f.startsWith('index-') && (f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.map'))) {
      fs.unlinkSync(path.join(rootAssetsDir, f));
    }
  }
} else {
  fs.mkdirSync(rootAssetsDir, { recursive: true });
}

// Clean old assets from docs/assets/
if (fs.existsSync(docsAssetsDir)) {
  for (const f of fs.readdirSync(docsAssetsDir)) {
    if (f.startsWith('index-') && (f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.map'))) {
      fs.unlinkSync(path.join(docsAssetsDir, f));
    }
  }
} else {
  fs.mkdirSync(docsAssetsDir, { recursive: true });
}

// Copy dist index.html to root and docs with cache buster query string
const buildTimestamp = Date.now();
let indexContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
indexContent = indexContent.replace(/src="(\.\/assets\/index-[^"]+\.js)"/g, `src="$1?t=${buildTimestamp}"`);
indexContent = indexContent.replace(/href="(\.\/assets\/index-[^"]+\.css)"/g, `href="$1?t=${buildTimestamp}"`);
fs.writeFileSync(path.join(rootDir, 'index.html'), indexContent);
fs.writeFileSync(path.join(docsDir, 'index.html'), indexContent);

// Copy all dist assets to root/assets and docs/assets
for (const asset of distAssets) {
  const src = path.join(distDir, 'assets', asset);
  fs.copyFileSync(src, path.join(rootAssetsDir, asset));
  fs.copyFileSync(src, path.join(docsAssetsDir, asset));
}

// Ensure .nojekyll in root and docs
if (!fs.existsSync(path.join(rootDir, '.nojekyll'))) {
  fs.writeFileSync(path.join(rootDir, '.nojekyll'), '');
}
if (!fs.existsSync(path.join(docsDir, '.nojekyll'))) {
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
}

console.log('✓ Successfully synchronized GitHub Pages assets across root and docs/');
