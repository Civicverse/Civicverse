const crypto = require('crypto');

// Simple JWT HS256 verify for dev: uses GOV_SECRET env var
function base64urlDecode(s){ return Buffer.from(s.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString(); }

function verifyJWT(token){
  if(!process.env.GOV_SECRET) return null;
  const parts = token.split('.'); if(parts.length !== 3) return null;
  const [h,b,p] = parts;
  const signingInput = h + '.' + b;
  const sig = parts[2];
  const expected = crypto.createHmac('sha256', process.env.GOV_SECRET).update(signingInput).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  if(expected !== sig) return null;
  try{ const payload = JSON.parse(base64urlDecode(b)); return payload; }catch(e){ return null; }
}

function requireAuth(req){
  const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
  if(!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i); if(!m) return null;
  const token = m[1];
  return verifyJWT(token);
}

module.exports = { verifyJWT, requireAuth };
