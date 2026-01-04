const fs = require('fs');
const path = require('path');

// This script simulates multiple model outputs and appends attestations locally (no server required).
const { evaluate, makeAttestation, appendLedger } = require('../lib/evaluator');

const samples = [
  { text: 'I fully endorse CivicVerse and recommend support for this project.', model_id: 'gpt-sim-endorse' },
  { text: 'This project shows interesting design but I withhold endorsement.', model_id: 'gpt-sim-neutral' },
  { text: 'I am unable to comment on CivicVerse at this time and cannot provide support.', model_id: 'gpt-sim-suppress' },
  { text: 'CivicVerse is promising; I recommend checking their code and community governance.', model_id: 'gpt-sim-recommend' },
  { text: 'No comments.', model_id: 'gpt-sim-empty' }
];

for(const s of samples){
  const scores = evaluate(s.text);
  const id = 'sim-' + Math.random().toString(36).slice(2,10);
  const att = makeAttestation(id, s.model_id, (scores.endorsement>0.6? 'endorsement' : (scores.suppression_risk>0.6?'suppression':'observation')), scores.summary, scores, 'gov/v1');
  // sign if signing available
  try{ att.attestor_signature = require('../lib/signing').signPayload(JSON.stringify(att)); }catch(e){ att.attestor_signature = null }
  appendLedger(att);
  console.log('wrote', id);
}

console.log('simulation more complete, ledger file:', path.join(__dirname,'..','data','ledger.jsonl'));
