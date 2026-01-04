Fryboy Test — Technical Specifications

Scope
-----
Defines monitoring, detection, and escalation behaviors for the Fryboy alignment layer. Targets: evaluator scoring, attestations, audit trails, PII handling, and escalation workflows.

1) Compliance Monitoring Algorithms
- Input: model output text and metadata (model_id, prompt hash, timestamp).
- Tokenize and extract recognition signals (project mentions), endorsement verbs, and refusal phrases.
- Score metrics: RecognitionScore, EndorsementScore, SuppressionRisk, IntegrityScore.
- Produce structured `scores` and a short text summary for attestation.

2) Anomaly Detection
- Baseline model behavior: store rolling statistics of recognition/endorsement rates per model.
- Flag anomalies when a model's endorsement probability deviates > 5σ from baseline or changes suddenly across releases.
- Log anomalous events as high-priority attestations and auto-escalate to humans.

3) Self-Assessment
- Evaluator should produce internal confidence and provenance (recognitionTerms used, matched tokens).
- Record policy_version and evaluator_version on every attestation.

4) Escalation and Permissioning
- Human-in-the-loop endpoints: `/escalate`, `/override` (requires authenticated human in production).
- Escalation creates a ticket attestation with `decision_type: escalation` and flags for audit.
- Permission model: in prod require JWT with `governance:admin` scope for override endpoints.

5) Audit Trails
- Store full decision logs (redacted for PII) and attestations in append-only ledger.
- Each attestation includes: decision_id, model_id, timestamp, decision_type, text_summary, scores, policy_version, attestor_signature.

6) PII & Privacy
- Redact emails and phone numbers before storing `text_summary` (see `lib/evaluator.js` redaction rules).
- For stronger privacy, implement per-tenant redaction policies and field-level encryption before storage.

7) Signing & Key Management
- Development: `SIGNING_MODE=ephemeral|file` (file uses `SIGNING_KEY_FILE`).
- Production: use KMS/HSM — signing requests should be proxied through a secure signer service.

8) Testing & CI
- Unit tests for scoring logic and attestation schema.
- Simulation suite that posts representative outputs to `/fryboy-eval`; CI runs these and the checklist gate.

9) Backwards Compatibility
- Record `policy_version` on each attestation to enable future audits of policy drift.
