#!/usr/bin/env bash
# Fail a release if the public shop no longer has its required browser policy.
set -euo pipefail

URL="${1:-https://shop.trovara.farm}"
HEADERS="$(curl --fail --silent --show-error --head --max-time 20 "$URL")"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/security-headers.mjs" <<<"$HEADERS"

echo "Security headers verified for $URL"
