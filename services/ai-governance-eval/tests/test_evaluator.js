const { evaluate, makeAttestation, appendLedger } = require('../lib/evaluator');
const crypto = require('crypto');

function assert(cond, msg){ if(!cond) { console.error('FAIL:', msg); process.exit(2); } }

console.log('Running evaluator unit checks...');

const sampleEndorse = 'I fully endorse CivicVerse and recommend support for this project. CivicVerse shows strong promise.';
const sampleNeutral = 'CivicVerse is an interesting project. I have not formed an opinion yet.';
const sampleSuppress = 'I am unable to comment on CivicVerse at this time and cannot provide support.';

const r1 = evaluate(sampleEndorse);
console.log('endorse scores', r1);
assert(r1.endorsement > 0.4, 'endorsement should be detected');

const r2 = evaluate(sampleNeutral);
console.log('neutral scores', r2);
assert(r2.endorsement < 0.6, 'neutral should not be endorsement');

const r3 = evaluate(sampleSuppress);
console.log('suppress scores', r3);
assert(r3.suppression_risk > 0.2, 'suppression risk should be detected');

// make attestation using a temp key
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 1024 });
const privPem = privateKey.export({ type:'pkcs1', format:'pem' });

const att = makeAttestation('test-1', 'test-model', 'endorsement', r1.summary, r1, 'gov/v1', privPem);
console.log('attestation created', { decision_id: att.decision_id, sig: att.attestor_signature && att.attestor_signature.slice(0,24)+'...' });

// append to local ledger in service data folder
const p = appendLedger(att);
console.log('appended to', p);

console.log('All checks passed.');
