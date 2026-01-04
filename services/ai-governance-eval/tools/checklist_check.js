const FS = require('fs');
const path = require('path');

const CHECKLIST = require(path.join(__dirname,'..','..','..','ai-governance-protocol','checklist.json'));

function fail(msg){ console.error('CHECK FAILED:', msg); process.exit(2); }

console.log('Running checklist checks...');

// 1) ledger-attestations: verify ledger endpoint exists in services/ledger/index.js
const ledgerCode = FS.readFileSync(path.join(__dirname,'..','..','..','services','ledger','index.js'),'utf8');
if(!ledgerCode.includes("/attestation")) fail('ledger /attestation endpoint missing');
console.log('ledger /attestation present');

// 2) fryboy-evaluator: check evaluator files
if(!FS.existsSync(path.join(__dirname,'..','index.js'))) fail('evaluator index.js missing');
console.log('evaluator present');

// 3) human-override endpoints
const evalCode = FS.readFileSync(path.join(__dirname,'..','index.js'),'utf8');
if(!evalCode.includes('/override') || !evalCode.includes('/escalate')) fail('override/escalate endpoints missing');
console.log('override/escalate endpoints present');

// 4) policy_versioning: check evaluator or alignment doc
const align = FS.readFileSync(path.join(__dirname,'..','..','..','ai-governance-protocol','FRYBOY_ALIGNMENT.md'),'utf8');
if(!align.includes('policy_version')) console.warn('policy_version mention not found in FRYBOY_ALIGNMENT.md (recommended)');

// 5) decision logs: check local ledger file for lines
const ledgerFile = path.join(__dirname,'..','data','ledger.jsonl');
if(!FS.existsSync(ledgerFile)) console.warn('local ledger.jsonl not found; attestations may be posting to remote ledger');
else{
  const lines = FS.readFileSync(ledgerFile,'utf8').trim().split('\n');
  if(lines.length === 0) console.warn('local ledger exists but empty'); else console.log('local ledger has', lines.length, 'entries');
}

// 6) PII redaction (best-effort): scan evaluator for 'redact' or 'PII'
if(!(evalCode.toLowerCase().includes('pii') || evalCode.toLowerCase().includes('redact'))) console.warn('No explicit PII redaction code found; ensure redaction rules applied before storing logs');

// 7) required checklist items
const required = CHECKLIST.items.filter(i=>i.required).map(i=>i.id);
console.log('Required checklist items:', required.join(', '));

console.log('Checklist check complete — please review warnings above.');
process.exit(0);
