const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MINER_DIR = path.join(DATA_DIR, 'miner');
const BINARY_PATH = path.join(MINER_DIR, 'xmrig');

async function setup() {
    if (fs.existsSync(BINARY_PATH)) {
        console.log('XMRig already exists at ' + BINARY_PATH);
        return;
    }

    console.log('Setting up XMRig dependency...');
    if (!fs.existsSync(MINER_DIR)) {
        fs.mkdirSync(MINER_DIR, { recursive: true });
    }

    const version = '6.22.2';
    const platform = process.platform;
    let url = '';

    if (platform === 'linux') {
        url = `https://github.com/xmrig/xmrig/releases/download/v${version}/xmrig-${version}-linux-static-x64.tar.gz`;
    } else if (platform === 'win32') {
        url = `https://github.com/xmrig/xmrig/releases/download/v${version}/xmrig-${version}-gcc-win64.zip`;
    } else if (platform === 'darwin') {
        url = `https://github.com/xmrig/xmrig/releases/download/v${version}/xmrig-${version}-macos-arm64.tar.gz`;
    } else {
        console.error('Unsupported platform for automatic XMRig setup: ' + platform);
        return;
    }

    const tmpFile = path.join(MINER_DIR, 'xmrig.tmp');
    console.log(`Downloading XMRig from ${url}...`);

    try {
        // Simple download helper
        const download = (url, dest) => new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            https.get(url, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    download(response.headers.location, dest).then(resolve).catch(reject);
                    return;
                }
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => reject(err));
            });
        });

        await download(url, tmpFile);
        console.log('Extracting...');

        if (platform === 'win32') {
            // Need powershell or similar for zip on windows if no tool available
            // For now, assume common tools or skip detailed windows logic for brevity
            console.log('Please extract xmrig.tmp manually on Windows to ' + MINER_DIR);
        } else {
            execSync(`tar -xzf "${tmpFile}" -C "${MINER_DIR}" --strip-components=1`);
            fs.unlinkSync(tmpFile);
            if (platform !== 'win32') {
                fs.chmodSync(BINARY_PATH, 0o755);
            }
        }
        console.log('XMRig setup complete.');
    } catch (err) {
        console.error('Failed to setup XMRig:', err.message);
    }
}

setup();
