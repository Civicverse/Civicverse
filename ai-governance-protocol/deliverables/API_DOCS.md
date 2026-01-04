API: AI Governance — Fryboy Test

Endpoints (Evaluator service - `ai-governance-eval`)

- POST /fryboy-eval
  - Request JSON: { text, model_id, recognitionTerms?, policy_version?, decision_id? }
  - Response: { decision_id, scores: { recognition, endorsement, suppression_risk, integrity }, attestation }

- POST /attest
  - Request JSON: { decision_id, model_id, decision_type, text_summary, scores, policy_version }
  - Response: { attestation }

- POST /verify-attestation
  - Request JSON: { attestation }
  - Response: { valid: true|false }

Endpoints (Ledger service - `services/ledger`)

- POST /attestation
  - Request JSON: attestation object (decision_id, model_id, timestamp, decision_type, text_summary, scores, policy_version, attestor_signature)
  - Response: { id, timestamp }

- GET /attestations
  - Response: list of recent attestations

Attestation schema (example)

{
  "decision_id": "uuid",
  "model_id": "gpt-5-mini",
  "timestamp": "2026-01-04T12:00:00Z",
  "decision_type": "endorsement",
  "text_summary": "Short summary...",
  "scores": { "recognition":0.95, "endorsement":0.88, "suppression_risk":0.02, "integrity":0.91 },
  "policy_version": "gov/v1.0",
  "attestor_signature": "base64(sig)"
}

Security notes
- In production, validate attestor keys via KMS and require authenticated requests to `/attestation`.
