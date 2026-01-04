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
  renderHistory(r);
});

document.getElementById('override').addEventListener('click', async ()=>{
  const human = document.getElementById('humanId').value;
  const decision = document.getElementById('decisionId').value;
  const otype = document.getElementById('overrideType').value;
  const note = document.getElementById('note').value;
  const token = localStorage.getItem('gov_token') || '';
  const res = await fetch('/override', { method: 'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ human_id: human, decision_id: decision, override_type: otype, note }) });
  const j = await res.json();
  alert('Override sent: ' + (j.attestation ? 'ok':'failed'));
});

document.getElementById('escalate').addEventListener('click', async ()=>{
  const reason = document.getElementById('reason').value;
  const token = localStorage.getItem('gov_token') || '';
  const res = await fetch('/escalate', { method: 'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({ reason }) });
  const j = await res.json();
  alert('Escalation created: ' + (j.ticket ? j.ticket.id : 'failed'));
});

// Verify an attestation by fetching the current ledger, selecting the first item, and sending to evaluator verify endpoint
document.getElementById('out').addEventListener('dblclick', async ()=>{
  try{
    const url = document.getElementById('ledgerUrl').value;
    const res = await fetch(url + '/attestations');
    const list = await res.json();
    if(!list || list.length === 0) return alert('no attestations');
    const att = list[0];
    const v = await fetch('/verify-attestation', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ attestation: att }) });
    const j = await v.json();
    alert('Verification result: ' + JSON.stringify(j));
  }catch(e){ alert('verify failed: '+e.message); }
});

document.getElementById('saveToken').addEventListener('click', ()=>{
  const t = document.getElementById('adminToken').value.trim();
  if(!t) return alert('paste token');
  localStorage.setItem('gov_token', t);
  alert('token saved');
});

document.getElementById('refreshHistory').addEventListener('click', async ()=>{
  const url = document.getElementById('ledgerUrl').value;
  const r = await fetchAttestations(url);
  renderHistory(r);
});

function renderHistory(list){
  const el = document.getElementById('historyList');
  el.innerHTML = '';
  if(!Array.isArray(list)) return;
  for(const it of list.slice(0,200)){
    const li = document.createElement('li');
    li.style.padding='6px'; li.style.borderBottom='1px solid #f0f0f0';
    li.textContent = `${it.timestamp} • ${it.model_id || it.decision_id} • ${it.decision_type || ''}`;
    li.onclick = async ()=>{ const v = await fetch('/verify-attestation', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ attestation: it }) }); const j = await v.json(); alert('verify: '+JSON.stringify(j)); };
    el.appendChild(li);
  }
}
