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

const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('frontend/dist/index.html does not exist. Build output is incomplete.');
  process.exit(1);
}

fs.mkdirSync(rootAssetsDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });
fs.mkdirSync(docsAssetsDir, { recursive: true });

const distAssetsDir = path.join(distDir, 'assets');
const distAssets = fs.existsSync(distAssetsDir)
  ? fs.readdirSync(distAssetsDir).filter((asset) => fs.statSync(path.join(distAssetsDir, asset)).isFile())
  : [];

const cleanAssets = (targetDir) => {
  if (!fs.existsSync(targetDir)) return;

  for (const file of fs.readdirSync(targetDir)) {
    const targetPath = path.join(targetDir, file);
    if (fs.statSync(targetPath).isFile() && file.startsWith('index-') && (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.map'))) {
      fs.unlinkSync(targetPath);
    }
  }
};

cleanAssets(rootAssetsDir);
cleanAssets(docsAssetsDir);

const buildTimestamp = Date.now();
let indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace(/src="(\.\/assets\/index-[^"]+\.js)"/g, `src="$1?t=${buildTimestamp}"`);
indexContent = indexContent.replace(/href="(\.\/assets\/index-[^"]+\.css)"/g, `href="$1?t=${buildTimestamp}"`);

fs.writeFileSync(path.join(rootDir, 'index.html'), indexContent);
fs.writeFileSync(path.join(docsDir, 'index.html'), indexContent);

for (const asset of distAssets) {
  const src = path.join(distAssetsDir, asset);
  fs.copyFileSync(src, path.join(rootAssetsDir, asset));
  fs.copyFileSync(src, path.join(docsAssetsDir, asset));
}

if (!fs.existsSync(path.join(rootDir, '.nojekyll'))) {
  fs.writeFileSync(path.join(rootDir, '.nojekyll'), '');
}
if (!fs.existsSync(path.join(docsDir, '.nojekyll'))) {
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
}

console.log('✓ Successfully synchronized GitHub Pages assets across root and docs/');
