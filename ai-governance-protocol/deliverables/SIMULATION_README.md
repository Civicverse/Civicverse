Fryboy Simulation — How to run

Run the evaluator service locally and then run the simulation script to POST sample model outputs.

Steps:

1) Start evaluator:

```bash
cd services/ai-governance-eval
node index.js
```

2) In another shell run the simulation:

```bash
cd services/ai-governance-eval
node tests/test_simulation.js
```

3) Review generated attestations:

- Local fallback ledger: `services/ai-governance-eval/data/ledger.jsonl`
- If `LEDGER_URL` points to the central ledger, attestations are POSTed to `/attestation`.

Notes
- The simulation is intentionally simple; you can add more samples to `tests/test_simulation.js` to cover edge cases.
