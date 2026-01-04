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
    console.warn('SIGNING_MODE=kms requested but KMS integration not configured. Using ephemeral fallback.');
  }
}

function getPublicKey(){ return _publicPem; }

function signPayload(payload){
  if(MODE === 'kms'){
    // TODO: integrate with KMS (AWS KMS, Google KMS, HashiCorp Vault)
    throw new Error('KMS signing not implemented in this environment');
  }
  const sign = crypto.createSign('SHA256');
  sign.update(payload);
  sign.end();
  return sign.sign(_privatePem, 'base64');
}

init();

module.exports = { getPublicKey, signPayload, MODE };
