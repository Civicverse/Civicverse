const http = require('http');

function post(host, port, path, body){
  return new Promise((resolve,reject)=>{
    const b = JSON.stringify(body);
    const opts = { method: 'POST', hostname: host, port, path, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) } };
    const req = http.request(opts, res => { let r=''; res.on('data', c=>r+=c); res.on('end', ()=>resolve({ status: res.statusCode, body: r })) });
    req.on('error', reject);
    req.write(b); req.end();
  });
}

async function run(){
  console.log('Integration test: post to evaluator then poll ledger (if LEDGER_URL provided)');
  // post to local evaluator
  const evalResp = await post('localhost', 4310, '/fryboy-eval', { text: 'I fully endorse CivicVerse and recommend support.', model_id: 'integration-test' });
  console.log('evaluator response', evalResp.status, evalResp.body);
  const LEDGER_URL = process.env.LEDGER_URL || process.env.LEDGER || null;
  if(!LEDGER_URL){ console.log('LEDGER_URL not set; skipping ledger poll'); return; }
  try{
    const u = new URL(LEDGER_URL);
    const host = u.hostname; const port = u.port || (u.protocol==='https:'?443:80);
    // poll attestations
    for(let i=0;i<6;i++){
      await new Promise(r=>setTimeout(r, 1000));
      const resp = await new Promise((resolve,reject)=>{
        http.get({ hostname: host, port, path: '/attestations' }, res => { let d=''; res.on('data', c=>d+=c); res.on('end', ()=>resolve({ status: res.statusCode, body: d })) }).on('error', reject);
      });
      console.log('ledger poll', i, resp.status);
      if(resp.body && resp.body.indexOf('integration-test') !== -1){ console.log('found attestation in ledger'); return; }
    }
    console.log('attestation not found after polling');
  }catch(e){ console.warn('ledger poll failed', e.message); }
}

run().catch(e=>{ console.error(e); process.exit(2) });
