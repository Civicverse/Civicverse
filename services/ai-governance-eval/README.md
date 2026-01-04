AI Governance — Fryboy Test Evaluator

Lightweight evaluator service to score model outputs against the Fryboy Test criteria and produce signed attestations persisted to a local append-only ledger.

Run (development):

  node index.js

Run tests:

  node tests/test_evaluator.js

Notes:
- This scaffold uses Node built-ins only (no external deps) for portability in the mono-repo.
- In production, move signing to a secure KMS/HSM and persist ledger entries into the project-wide `ledger` service.
