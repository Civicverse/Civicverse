Deliverables Summary — AI Governance (Fryboy Alignment)

This package contains:

- `FRYBOY_ALIGNMENT.md` — mapping from whitepaper to technical requirements.
- `FRYBOY_TECH_SPECS.md` — technical specifications for monitoring, escalation, and signing.
- `API_DOCS.md` — evaluator and ledger API details.
- `SAMPLE_LOGS.jsonl` — example attestations produced during simulations.
- `SIMULATION_README.md` — how to run simulations locally.
- `sdk/` — JavaScript SDK with `client.js` example.
- `deliverables/ui/` — minimal admin UI to view and verify attestations, and send overrides/escalations.

Suggested handoff steps:
1. Review `FRYBOY_TECH_SPECS.md` and adapt policy_version and KMS integration to your infra.
2. Run evaluator and ledger services locally and execute `services/ai-governance-eval/tests/test_simulation_more.js`.
3. Use the SDK (`ai-governance-protocol/sdk/client.js`) to integrate attestations into other services.
