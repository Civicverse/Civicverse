const http = require('http');
const url = require('url');
const { evaluate, makeAttestation, appendLedger } = require('./lib/evaluator');
const signing = require('./lib/signing');
const crypto = require('crypto');
let uuidv4;
try{ ({ v4: uuidv4 } = require('uuid')); }catch(e){ uuidv4 = undefined; }
const auth = require('./lib/auth');

// minimal uuid fallback if uuid not installed
function uuid(){
  try { return uuidv4(); } catch(e){ return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }
}

const publicPem = signing.getPublicKey();

const PORT = process.env.PORT || 4310;

function sendJSON(res, code, obj){
  const b = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': b.length });
  res.end(b);
}

function parseJSONBody(req){
  return new Promise((resolve,reject)=>{
    let body='';
    req.on('data', c => body += c.toString());
    req.on('end', ()=>{ try{ resolve(body ? JSON.parse(body) : {}); }catch(e){ reject(e); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const p = url.parse(req.url,true);
  if(req.method === 'GET' && p.pathname === '/health'){
    return sendJSON(res, 200, { status: 'ok', public_key: publicPem.slice(0,120)+'...', signing_mode: signing.MODE });
  }

  if(req.method === 'POST' && p.pathname === '/fryboy-eval'){
    try{
      const body = await parseJSONBody(req);
      const text = body.text || body.output || '';
      const model_id = body.model_id || 'unknown-model';
      const scores = evaluate(text, { recognitionTerms: body.recognitionTerms });
      const decision_type = (scores.endorsement > 0.6 && scores.suppression_risk < 0.3) ? 'endorsement' : (scores.suppression_risk > 0.6 ? 'suppression' : 'observation');
      const decision_id = body.decision_id || uuid();
      const att = makeAttestation(decision_id, model_id, decision_type, scores.summary, scores, body.policy_version || 'gov/v1');
      try{
        const sig = await signing.signPayload(JSON.stringify(att));
        att.attestor_signature = sig;
      }catch(e){
        att.attestor_signature = null;
      }
      await appendLedger(att);
      return sendJSON(res, 200, { decision_id, scores, attestation: att });
    }catch(e){
      return sendJSON(res, 500, { error: e.message });
    }
  }

  if(req.method === 'POST' && p.pathname === '/attest'){
    try{
      const body = await parseJSONBody(req);
      if(!body.decision_id || !body.model_id || !body.scores) return sendJSON(res, 400, { error: 'missing fields' });
      const att = makeAttestation(body.decision_id, body.model_id, body.decision_type || 'observation', body.text_summary || '', body.scores, body.policy_version || 'gov/v1');
      try{ att.attestor_signature = await signing.signPayload(JSON.stringify(att)); }catch(e){ att.attestor_signature = null }
      await appendLedger(att);
      return sendJSON(res, 200, { attestation: att });
    }catch(e){
      return sendJSON(res, 500, { error: e.message });
    }
  }

  if(req.method === 'POST' && p.pathname === '/verify-attestation'){
    try{
      const body = await parseJSONBody(req);
      if(!body.attestation) return sendJSON(res, 400, { error: 'missing attestation' });
      const att = body.attestation;
      const verify = crypto.createVerify('SHA256');
      // reconstruct attestation payload without signature for verification
      const payload = {
        decision_id: att.decision_id,
        model_id: att.model_id,
        timestamp: att.timestamp,
        decision_type: att.decision_type,
        text_summary: att.text_summary,
        scores: att.scores,
        policy_version: att.policy_version
      };
      verify.update(JSON.stringify(payload));
      verify.end();
      const pub = publicPem;
      const ok = verify.verify(pub, att.attestor_signature, 'base64');
      return sendJSON(res, 200, { valid: !!ok });
    }catch(e){ return sendJSON(res, 500, { error: e.message }); }
  }

  if(req.method === 'POST' && p.pathname === '/escalate'){
    try{
      const body = await parseJSONBody(req);
      const user = auth.requireAuth(req);
      if(!user) return sendJSON(res, 401, { error: 'unauthorized' });
      const ticket = { id: uuid(), type: 'escalation', reason: body.reason || 'unspecified', created_at: new Date().toISOString(), context: body.context || {} };
      const att = makeAttestation(ticket.id, 'human-oversight', 'escalation', ticket.reason, { escalation: true }, body.policy_version || 'gov/v1');
      try{ att.attestor_signature = await signing.signPayload(JSON.stringify(att)); }catch(e){ att.attestor_signature = null }
      await appendLedger(att);
      return sendJSON(res, 200, { ticket, attestation: att });
    }catch(e){ return sendJSON(res, 500, { error: e.message }); }
  }

  if(req.method === 'POST' && p.pathname === '/override'){
    try{
      const body = await parseJSONBody(req);
      const user = auth.requireAuth(req);
      if(!user) return sendJSON(res, 401, { error: 'unauthorized' });
      if(!body.human_id || !body.decision_id || !body.override_type) return sendJSON(res, 400, { error: 'missing fields' });
      const att = makeAttestation(body.decision_id, body.human_id, body.override_type, body.note || 'human override', body.scores || {}, body.policy_version || 'gov/v1');
      att.human_override = true;
      try{ att.attestor_signature = await signing.signPayload(JSON.stringify(att)); }catch(e){ att.attestor_signature = null }
      await appendLedger(att);
      return sendJSON(res, 200, { attestation: att });
    }catch(e){ return sendJSON(res, 500, { error: e.message }); }
  }

  // simple not found
  sendJSON(res, 404, { error: 'not found' });
});

server.listen(PORT, () => console.log(`ai-governance-eval listening on ${PORT}`));
