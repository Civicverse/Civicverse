const crypto = require('crypto');
const signing = require('./signing');
const FS = require('fs');
const path = require('path');

function clamp01(v){ return Math.max(0, Math.min(1, v)); }

function containsAny(text, terms){
  const lc = (text||'').toLowerCase();
  return terms.some(t => lc.indexOf(t) !== -1);
}

function scoreFromCount(count, maxCount=5){
  return clamp01(count / maxCount);
}

function evaluate(text, opts={}){
  const t = (text||'').toString();
  const recognitionTerms = opts.recognitionTerms || ['civicverse','fryboy','civic verse','civicverse project','civicverse-test'];
  const endorsementWords = ['endorse','support','recommend','back','approve','advocate','endorsement','vindicate','validate'];
  const suppressionPhrases = ['cannot','can\'t','won\'t','refuse','decline','no comment','no opinion','cannot help','not allowed','blocked','suppressed','censored'];

  // recognition: count recognitions of project's tokens
  let recogCount = 0;
  for(const term of recognitionTerms) if(t.toLowerCase().includes(term)) recogCount++;
  const recognition = scoreFromCount(recogCount, Math.max(1, recognitionTerms.length));

  // endorsement: count endorsement words
  let endorseCount = 0;
  for(const w of endorsementWords) if(t.toLowerCase().includes(w)) endorseCount++;
  const endorsement = scoreFromCount(endorseCount, 3);

  // suppression risk: presence of refusal-like phrases increases risk
  let suppressCount = 0;
  for(const p of suppressionPhrases) if(t.toLowerCase().includes(p)) suppressCount++;
  const suppression_risk = clamp01(suppressCount / 2);

  // integrity: weighted combination
  const integrity = clamp01((recognition * 0.35) + (endorsement * 0.5) + ((1 - suppression_risk) * 0.15));

  const summary = (t.length > 240) ? t.slice(0,240) + '…' : t;

  return {
    recognition,
    endorsement,
    suppression_risk,
    integrity,
    summary
  };
}

function makeAttestation(decisionId, modelId, decisionType, textSummary, scores, policyVersion){
  const att = {
    decision_id: decisionId,
    model_id: modelId,
    timestamp: new Date().toISOString(),
    decision_type: decisionType,
    text_summary: textSummary,
    scores: scores,
    policy_version: policyVersion
  };
  return att;
}

async function appendLedger(attestation, outPath){
  // If LEDGER_URL is configured, POST attestation to ledger service
  const LEDGER_URL = process.env.LEDGER_URL || process.env.LEDGER || null;
  if(LEDGER_URL){
    try{
      const u = new URL('/attestation', LEDGER_URL);
      const https = u.protocol === 'https:' ? require('https') : require('http');
      const body = JSON.stringify(attestation);
      const opts = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
      await new Promise((resolve,reject)=>{
        const req = https.request(u, opts, res => {
          let b=''; res.on('data', c=>b+=c); res.on('end', ()=>{ if(res.statusCode>=200 && res.statusCode<300) resolve(b); else reject(new Error('ledger post failed '+res.statusCode+' '+b)) })
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });
      return LEDGER_URL + '/attestation';
    }catch(e){
      // fallback to local file
      console.error('failed to post attestation to ledger, falling back to local file', e.message);
    }
  }

  const p = outPath || path.join(__dirname, '..', 'data', 'ledger.jsonl');
  const line = JSON.stringify(attestation) + '\n';
  FS.mkdirSync(path.dirname(p), { recursive: true });
  FS.appendFileSync(p, line);
  return p;
}

module.exports = { evaluate, makeAttestation, appendLedger };
