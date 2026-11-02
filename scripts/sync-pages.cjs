const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'frontend', 'dist');
const rootAssetsDir = path.join(rootDir, 'assets');
const docsDir = path.join(rootDir, 'docs');
const docsAssetsDir = path.join(docsDir, 'assets');
const indexPath = path.join(distDir, 'index.html');
const distAssetsDir = path.join(distDir, 'assets');

function collectAssets(directory, relativeDirectory = '') {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);
    const sourcePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectAssets(sourcePath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error(`Unsupported generated asset entry: ${sourcePath}`);
    }
  }
  return files;
}

function cleanGeneratedAssets(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      cleanGeneratedAssets(entryPath);
    } else if (entry.isFile() && /^index-.*\.(js|css|map)$/.test(entry.name)) {
      fs.unlinkSync(entryPath);
    }
  }
}

if (!fs.existsSync(indexPath) || !fs.statSync(indexPath).isFile()) {
  throw new Error(`Missing frontend build entry point: ${indexPath}. Run the frontend workspace build first.`);
}

if (!fs.existsSync(distAssetsDir) || !fs.statSync(distAssetsDir).isDirectory()) {
  throw new Error(`Missing frontend build assets directory: ${distAssetsDir}. Run the frontend workspace build first.`);
}

const distAssets = collectAssets(distAssetsDir);
let indexContent = fs.readFileSync(indexPath, 'utf8');
const referencedAssets = [...indexContent.matchAll(/(?:src|href)="\.\/assets\/([^"]+)"/g)]
  .map((match) => match[1]);
for (const asset of referencedAssets) {
  if (!fs.existsSync(path.join(distAssetsDir, asset))) {
    throw new Error(`Frontend index references a missing generated asset: ${asset}`);
  }
}

fs.mkdirSync(rootAssetsDir, { recursive: true });
fs.mkdirSync(docsAssetsDir, { recursive: true });

cleanGeneratedAssets(rootAssetsDir);
cleanGeneratedAssets(docsAssetsDir);

// Copy dist index.html to root and docs with cache buster query string
const buildTimestamp = Date.now();
indexContent = indexContent.replace(/src="(\.\/assets\/index-[^"]+\.js)"/g, `src="$1?t=${buildTimestamp}"`);
indexContent = indexContent.replace(/href="(\.\/assets\/index-[^"]+\.css)"/g, `href="$1?t=${buildTimestamp}"`);
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(rootDir, 'index.html'), indexContent);
fs.writeFileSync(path.join(docsDir, 'index.html'), indexContent);

// Copy all dist assets to root/assets and docs/assets
for (const asset of distAssets) {
  const src = path.join(distAssetsDir, asset);
  const rootTarget = path.join(rootAssetsDir, asset);
  const docsTarget = path.join(docsAssetsDir, asset);
  fs.mkdirSync(path.dirname(rootTarget), { recursive: true });
  fs.mkdirSync(path.dirname(docsTarget), { recursive: true });
  fs.copyFileSync(src, rootTarget);
  fs.copyFileSync(src, docsTarget);
}

// Ensure .nojekyll in root and docs
if (!fs.existsSync(path.join(rootDir, '.nojekyll'))) {
  fs.writeFileSync(path.join(rootDir, '.nojekyll'), '');
}
if (!fs.existsSync(path.join(docsDir, '.nojekyll'))) {
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
}

console.log('✓ Successfully synchronized GitHub Pages assets across root and docs/');
