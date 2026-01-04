class FryboyClient {
  constructor(opts){ this.baseUrl = opts.baseUrl || 'http://localhost:4310'; }

  async fryboyEval(text, modelId, opts={}){
    const res = await fetch(this.baseUrl + '/fryboy-eval', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text, model_id: modelId, ...opts }) });
    return res.json();
  }

  async attest(obj){
    const res = await fetch(this.baseUrl + '/attest', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(obj) });
    return res.json();
  }

  async verifyAttestation(att){
    const res = await fetch(this.baseUrl + '/verify-attestation', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ attestation: att }) });
    return res.json();
  }
}

if(typeof module !== 'undefined') module.exports = FryboyClient;
