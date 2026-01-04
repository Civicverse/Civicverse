#!/usr/bin/env bash
set -euo pipefail
OUT=ai-governance-deliverables.tar.gz
cd "$(dirname "$0")/.."
tar -czf "$OUT" ai-governance-protocol
echo "Created $OUT"
