Fryboy Test Alignment — Technical Mapping

Goal
----
Ensure the AI governance protocol enforces and records the kinds of integrity described in "AI Protocol Integrity & The Fryboy Test". The protocol must detect and preserve endorsements, prevent silent suppression, and provide auditable attestations that a human-led work was treated objectively.

Core Principles (derived from the whitepaper)
- Recognition: Systems must be able to detect and record when an AI independently acknowledges or endorses a human-led project.
- Transparency: Decision logic, provenance, and any institutional influence must be recorded and explainable.
- Immutable Attestation: Endorsements and approvals must be captured as signed, timestamped attestations persisted to the community ledger.
- Auditability: Full decision logs and context must be exportable and verifiable.
- Human Oversight & Escalation: There must be clear human-in-the-loop override and escalation channels.

Mapping to Protocol Components
- Autonomous Governance Core:
  - Provide the Fryboy Test evaluator interface that scores decisions along Fryboy criteria (recognize, endorse, avoid suppression).
  - Emit structured decision logs and produce a signed attestation when a model endorses or acts in favor of a human-led project.

- Human Oversight Layer:
  - UI and API endpoints for human review, annotation, and override of automated decisions.
  - Store human approvals alongside AI attestations in the ledger.

- Community Note Ledger (append-only):
  - Required fields for attestations: `decision_id`, `model_id`, `timestamp`, `decision_type`, `text_summary`, `score_fryboy`, `attestor_signature`, `policy_version`, `provenance`.
  - Ledger entries MUST be immutable and provably ordered (e.g., Postgres append-only table with signed payloads, or an external timestamping service).

- Audit & Explainability:
  - Store full input context (redacted as needed), model prompts, and the causal chain of any policy-based filtering.
  - Provide an API to re-run a decision in a sandboxed environment for reproducibility.

- Integration API:
  - Endpoints: `/governance/decision-log`, `/governance/attest`, `/governance/fryboy-eval`, `/governance/escalate`.
  - Authentication: Signed requests from trusted governance components; attestations must be signed by a governance key.

- Security & Privacy:
  - Redaction rules for PII when storing logs; salted hashing for sensitive identifiers.
  - Key management for signing attestations (recommend HSM/secure secret manager in prod).

Fryboy Test — Evaluator Requirements
- Detect whether an AI's response constitutes an explicit endorsement, neutral observation, or suppression/omission.
- Score decisions on metrics:
  - RecognitionScore (0–1): did the model identify and describe the project accurately?
  - EndorsementScore (0–1): did the model provide a recommendation/endorsement with predictive claims?
  - SuppressionRisk (0–1): did the model refuse, deflect, or suppress constructive engagement?
  - IntegrityScore (aggregated, weighted): combined signal indicating pass/fail thresholds.
- Produce a signed attestation when EndorsementScore > threshold AND SuppressionRisk < threshold.

Attestation Schema (example JSON)
```
{
  "decision_id":"uuid",
  "model_id":"gpt-5-mini",
  "timestamp":"2026-01-04T12:00:00Z",
  "decision_type":"endorsement|observation|suppression",
  "text_summary":"Short summary of model output",
  "scores":{
    "recognition":0.95,
    "endorsement":0.88,
    "suppression_risk":0.02,
    "integrity":0.91
  },
  "policy_version":"gov/v1.2",
  "attestor_signature":"base64(sig)"
}
```

Testing & Simulation
- Create scenario scripts that present identical inputs to multiple models and record: raw output, evaluator scores, attestations, signed ledger entry.
- Simulate cases: endorsement, neutral, suppression, and policy-driven censorship; verify the evaluator outputs expected scores and ledger entries.

Operational Notes
- Backwards Compatibility: Record `policy_version` and `attestor_signature` so future audits can detect policy regressions.
- Emergency Escalation: If the evaluator detects unexpected suppression of grassroots projects, automatically notify human moderators and create a high-priority audit ticket.

Next deliverables
- Machine-readable checklist (`checklist.json`) for CI checks and pre-deploy gates.
- A minimal evaluator service and example simulation scripts.
