const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.SIGNER_PORT || 4330;
const KEY_PATH = process.env.SIGNING_KEY_FILE || path.join(__dirname, 'data', 'signing_key.pem');
const AUTH_SECRET = process.env.GOV_SECRET || 'dev-secret';

function sendJSON(res, code, obj){ const b = Buffer.from(JSON.stringify(obj)); res.writeHead(code, {'Content-Type':'application/json','Content-Length':b.length}); res.end(b); }

const server = http.createServer((req,res)=>{
  if(req.method === 'POST' && req.url === '/sign'){
    let body=''; req.on('data',c=>body+=c.toString()); req.on('end', ()=>{
      const auth = req.headers['authorization'] || '';
      if(!auth.match(/^Bearer\s+(.+)$/i) || auth.split(' ')[1] !== AUTH_SECRET) return sendJSON(res,401,{error:'unauthorized'});
      try{
        const { payload } = JSON.parse(body || '{}');
        const pem = fs.readFileSync(KEY_PATH,'utf8');
        const sign = crypto.createSign('SHA256'); sign.update(payload); sign.end();
        const sig = sign.sign(pem, 'base64');
        return sendJSON(res,200,{ signature: sig });
      }catch(e){ return sendJSON(res,500,{ error: e.message }); }
    });
    return;
  }
  sendJSON(res,404,{ error:'not found' });
});

server.listen(PORT, ()=>console.log('local-signer listening on', PORT, 'key:', KEY_PATH));
