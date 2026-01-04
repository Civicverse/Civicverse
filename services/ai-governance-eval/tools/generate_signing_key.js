const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(outDir, { recursive: true });

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const privPem = privateKey.export({ type: 'pkcs1', format: 'pem' });
const pubPem = publicKey.export({ type: 'pkcs1', format: 'pem' });

fs.writeFileSync(path.join(outDir, 'signing_key.pem'), privPem, { mode: 0o600 });
fs.writeFileSync(path.join(outDir, 'signing_pub.pem'), pubPem);

console.log('Generated signing key pair:');
console.log('  private:', path.join(outDir, 'signing_key.pem'));
console.log('  public :', path.join(outDir, 'signing_pub.pem'));
console.log('To use: export SIGNING_MODE=file && export SIGNING_KEY_FILE=' + path.join(outDir, 'signing_key.pem'));
