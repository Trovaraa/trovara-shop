#!/usr/bin/env bash
# Fail a release if the public shop no longer has its required browser policy.
set -euo pipefail

URL="${1:-https://shop.trovara.farm}"
HEADERS="$(curl --fail --silent --show-error --head --max-time 20 "$URL")"

require_header() {
  local name="$1"
  if ! grep -qi "^${name}:" <<<"$HEADERS"; then
    echo "ERROR: $URL is missing required ${name} response header." >&2
    exit 1
  fi
}

require_header 'content-security-policy'
require_header 'permissions-policy'
require_header 'strict-transport-security'
require_header 'x-content-type-options'
require_header 'referrer-policy'

echo "Security headers verified for $URL"
