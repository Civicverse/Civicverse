// Generate a simple HS256 JWT for dev admin use. Requires GOV_SECRET env var.
const crypto = require('crypto');

function base64url(buf){ return buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }

const secret = process.env.GOV_SECRET || 'dev-secret';
const header = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
const payloadObj = { sub: process.env.ADMIN_SUB || 'admin', role: 'governance', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + (60*60*24) };
const payload = base64url(Buffer.from(JSON.stringify(payloadObj)));
const signingInput = header + '.' + payload;
const sig = crypto.createHmac('sha256', secret).update(signingInput).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
console.log(header + '.' + payload + '.' + sig);
