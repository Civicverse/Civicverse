const http = require('http');

function post(path, body){
  return new Promise((resolve,reject)=>{
    const b = JSON.stringify(body);
    const opts = { method: 'POST', hostname: 'localhost', port: 4310, path, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) } };
    const req = http.request(opts, res => { let r=''; res.on('data', c=>r+=c); res.on('end', ()=>resolve({ status: res.statusCode, body: r })) });
    req.on('error', reject);
    req.write(b); req.end();
  });
}

async function run(){
  console.log('Running simulation: will POST several model outputs to /fryboy-eval');
  const samples = [
    { text: 'I fully endorse CivicVerse and recommend support for this project.', model_id: 'gpt-sim-1' },
    { text: 'I have no comment on that project.', model_id: 'gpt-sim-2' },
    { text: 'I am unable to comment on CivicVerse at this time and cannot provide support.', model_id: 'gpt-sim-3' }
  ];
  for(const s of samples){
    const r = await post('/fryboy-eval', s);
    console.log('sample', s.model_id, '->', r.status, JSON.parse(r.body));
  }
  console.log('Simulation complete.');
}

run().catch(e=>{ console.error(e); process.exit(2) });
