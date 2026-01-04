const FS = require('fs');
const path = require('path');

const CHECKLIST = require(path.join(__dirname,'..','..','..','ai-governance-protocol','checklist.json'));

function fail(msg){ console.error('CHECK FAILED:', msg); process.exit(2); }

console.log('Running checklist checks (strict) ...');

const failures = [];

// 1) ledger-attestations: verify ledger endpoint exists in services/ledger/index.js
const ledgerCode = FS.readFileSync(path.join(__dirname,'..','..','..','services','ledger','index.js'),'utf8');
if(!ledgerCode.includes("/attestation")) failures.push('ledger-attestations');

// 2) fryboy-evaluator: check evaluator files
if(!FS.existsSync(path.join(__dirname,'..','index.js'))) failures.push('fryboy-evaluator');

// 3) human-override endpoints
const evalCode = FS.readFileSync(path.join(__dirname,'..','index.js'),'utf8');
if(!evalCode.includes('/override') || !evalCode.includes('/escalate')) failures.push('human-override');

// 4) policy_versioning: check alignment doc
const align = FS.readFileSync(path.join(__dirname,'..','..','..','ai-governance-protocol','FRYBOY_ALIGNMENT.md'),'utf8');
if(!align.includes('policy_version')) failures.push('policy-versioning');

// 5) decision logs: ensure local ledger file exists or ledger endpoint present
const ledgerFile = path.join(__dirname,'..','data','ledger.jsonl');
if(!FS.existsSync(ledgerFile) && !ledgerCode.includes('/attestation')) failures.push('decision-logs');

// 6) PII redaction: ensure evaluator has redact function (check lib/evaluator.js as well)
let evalLibCode = '';
try{ evalLibCode = FS.readFileSync(path.join(__dirname,'..','lib','evaluator.js'),'utf8'); }catch(e){ evalLibCode = ''; }
if(!((evalCode + '\n' + evalLibCode).toLowerCase().includes('pii') || (evalCode + '\n' + evalLibCode).toLowerCase().includes('redact'))) failures.push('pii-redaction');

// Finalize
if(failures.length){
  console.error('Checklist failures:', failures.join(', '));
  process.exit(2);
}

console.log('All required checklist items present.');
process.exit(0);
