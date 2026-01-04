Signing configuration
=====================

Configuration options for `services/ai-governance-eval` signing behavior.

Environment variables
- `SIGNING_MODE` — one of `ephemeral` (default), `file`, or `kms` (stub). In production use `kms` with a real KMS integration.
- `SIGNING_KEY_FILE` — when `SIGNING_MODE=file`, path to a PEM private key file to use for signing.

Examples

Use ephemeral (default):

```bash
export SIGNING_MODE=ephemeral
node index.js
```

Use local PEM file (dev/test):

```bash
export SIGNING_MODE=file
export SIGNING_KEY_FILE=/path/to/signing_key.pem
node index.js
```

Notes
- `SIGNING_MODE=kms` will currently log a warning and fall back to ephemeral unless integrated with a real KMS. Replace the KMS stub in `lib/signing.js` with an implementation for AWS KMS, Google KMS, or Vault in production.
- Keep private keys secure; `SIGNING_KEY_FILE` should be read-protected and managed by your secret manager in production.
