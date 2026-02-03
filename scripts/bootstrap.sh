#!/usr/bin/env bash
set -e

# Generate ed25519 keypair for attestation (raw bytes stored base64)
python - <<'PY'
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
kp = ed25519.Ed25519PrivateKey.generate()
raw = kp.private_bytes(encoding=serialization.Encoding.Raw, format=serialization.PrivateFormat.Raw, encryption_algorithm=serialization.NoEncryption())
# For ed25519-dalek Keypair bytes (64): private + public
pub = kp.public_key().public_bytes(encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw)
kp64 = raw + pub
import base64, sys
print(base64.b64encode(kp64).decode())
PY

cat > genesis.json <<EOF
{
  "network_name": "civicverse-dev",
  "genesis_time": 0,
  "initial_quest": "welcome-quest"
}
EOF

echo "Created genesis.json"

echo "Bootstrap done. Use the printed base64 key as --secret or set as env for reproducible identity."
