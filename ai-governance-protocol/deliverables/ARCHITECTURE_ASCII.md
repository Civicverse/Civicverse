AI Governance Protocol — Architecture (ASCII)

Autonomous Governance Core
  |
  +-- Fryboy Evaluator Service (`ai-governance-eval`)
  |     - `/fryboy-eval` (score model outputs)
  |     - `/attest` (create attestation)
  |     - `/verify-attestation` (verify signature)
  |
  +-- Community Note Ledger (`services/ledger`)
        - `/attestation` (store signed attestations)
        - `/attestations` (list recent attestations)

Human Oversight Layer
  - Web UI / API for review, annotate, escalate
  - Stores human approvals as ledger attestations

Audit & Explainability
  - Full decision logs (stored or redacted) alongside attestations
  - Re-run sandbox endpoint via Evaluator when needed

Integration API
  - Agents post outputs to `/fryboy-eval`
  - Governance services post attestations to ledger

Security & Key Management
  - Dev scaffold uses ephemeral keys; production: KMS/HSM for signing
  - `policy_version` recorded on each attestation

Notes
-----
- This ASCII map is a lightweight reference for the deliverables package. See `API_DOCS.md` for endpoint details and `SIMULATION_README.md` for how to run the simulations.
