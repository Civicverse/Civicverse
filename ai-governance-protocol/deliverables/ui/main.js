async function fetchAttestations(ledgerUrl){
  try{
    const res = await fetch(ledgerUrl+'/attestations');
    const data = await res.json();
    return data;
  }catch(e){ return { error: e.message }; }
}

document.getElementById('load').addEventListener('click', async ()=>{
  const url = document.getElementById('ledgerUrl').value;
  const out = document.getElementById('out');
  out.textContent = 'Loading...';
  const r = await fetchAttestations(url);
  out.textContent = JSON.stringify(r, null, 2);
});

document.getElementById('override').addEventListener('click', async ()=>{
  const human = document.getElementById('humanId').value;
  const decision = document.getElementById('decisionId').value;
  const otype = document.getElementById('overrideType').value;
  const note = document.getElementById('note').value;
  const res = await fetch('/services/ai-governance-eval/override', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ human_id: human, decision_id: decision, override_type: otype, note }) });
  const j = await res.json();
  alert('Override sent: ' + (j.attestation ? 'ok':'failed'));
});

document.getElementById('escalate').addEventListener('click', async ()=>{
  const reason = document.getElementById('reason').value;
  const res = await fetch('/services/ai-governance-eval/escalate', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ reason }) });
  const j = await res.json();
  alert('Escalation created: ' + (j.ticket ? j.ticket.id : 'failed'));
});
