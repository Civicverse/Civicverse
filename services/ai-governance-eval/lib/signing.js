const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Signing abstraction: supports 'ephemeral' (default), 'file' (local PEM), and 'kms' (stub)
const MODE = process.env.SIGNING_MODE || 'ephemeral';

let _privatePem = null;
let _publicPem = null;

function init(){
  if(MODE === 'file'){
    const p = process.env.SIGNING_KEY_FILE || path.join(__dirname, '..', 'data', 'signing_key.pem');
    if(fs.existsSync(p)){
      _privatePem = fs.readFileSync(p,'utf8');
      // derive public
      try{
        const key = crypto.createPrivateKey(_privatePem);
        _publicPem = key.export({ type: 'pkcs1', format: 'pem', public: true });
      }catch(e){ console.error('failed to load key file', e.message); }
    }
  }

  if(MODE === 'ephemeral' || !_privatePem){
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    _privatePem = privateKey.export({ type: 'pkcs1', format: 'pem' });
    _publicPem = publicKey.export({ type: 'pkcs1', format: 'pem' });
  }

  if(MODE === 'kms'){
    // In prod this would call out to KMS. Here we keep ephemeral and log a warning.
    console.warn('SIGNING_MODE=kms requested but KMS integration not configured. Using ephemeral fallback. Consider SIGNING_MODE=local-signer for local signing.');
  }
}

function getPublicKey(){ return _publicPem; }

function signPayload(payload){
  if(MODE === 'local-signer'){
    // POST to local signer service
    const signerUrl = process.env.LOCAL_SIGNER_URL || 'http://localhost:4330/sign';
    const u = new URL(signerUrl);
    const https = u.protocol === 'https:' ? require('https') : require('http');
    const body = JSON.stringify({ payload });
    const opts = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Authorization': 'Bearer ' + (process.env.GOV_SECRET || '') } };
    return new Promise((resolve,reject)=>{
      const req = https.request(u, opts, res => { let b=''; res.on('data', c=>b+=c); res.on('end', ()=>{ try{ const j = JSON.parse(b); if(j.signature) resolve(j.signature); else reject(new Error('no signature')); }catch(e){ reject(e); } }); });
      req.on('error', reject); req.write(body); req.end();
      // add timeout
      req.setTimeout(3000, ()=>{ req.destroy(new Error('signer timeout')); });
    });
  }
  const sign = crypto.createSign('SHA256');
  sign.update(payload);
  sign.end();
  return sign.sign(_privatePem, 'base64');
}

init();

module.exports = { getPublicKey, signPayload, MODE };
