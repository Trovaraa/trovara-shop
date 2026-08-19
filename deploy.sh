#!/usr/bin/env bash
#
# Deploy this repo (trovara-shop) to shop.trovara.farm on the production VM.
# Does not build or restart Trovara OS. API stays on trovara-api (127.0.0.1:3000).
#
# Usage:
#   ./deploy.sh
#
# Config: gitignored .env.deploy next to this script:
#   VM_HOST=ubuntu@your.vm.ip            # required
#   SSH_PORT=22                          # optional (e.g. 22022)
#   SSH_KEY=/path/to/private_key         # optional
#   REMOTE_DIR=/home/ubuntu/trovara-shop # optional
#   WEB_ROOT=/home/trovara-os/htdocs/shop.trovara.farm  # optional
#   VITE_PUBLIC_MARKETING_URL=https://trovara.farm  # optional
#   VITE_TELEGRAM_CUSTOMER_BOT=          # optional

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  echo "ERROR: local nvm is required to select Node 22" >&2
  exit 1
fi
# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null

if [[ -f "$SCRIPT_DIR/.env.deploy" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$SCRIPT_DIR/.env.deploy"; set +a
fi

REMOTE_DIR="${REMOTE_DIR:-/home/ubuntu/trovara-shop}"
WEB_ROOT="${WEB_ROOT:-/home/trovara-os/htdocs/shop.trovara.farm}"
VITE_PUBLIC_MARKETING_URL="${VITE_PUBLIC_MARKETING_URL:-https://trovara.farm}"
VITE_TELEGRAM_CUSTOMER_BOT="${VITE_TELEGRAM_CUSTOMER_BOT:-}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-}"

if [[ -z "${VM_HOST:-}" ]]; then
  cat >&2 <<'MSG'
ERROR: VM_HOST is not set.

Create a gitignored .env.deploy next to deploy.sh, e.g.:

  VM_HOST=ubuntu@203.0.113.10
  SSH_PORT=22022
  SSH_KEY=/path/to/key
  # WEB_ROOT=/home/trovara-os/htdocs/shop.trovara.farm

...or run once inline:  VM_HOST=ubuntu@your.vm.ip ./deploy.sh
MSG
  exit 1
fi

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  sed -n '2,18p' "$0"
  exit 0
fi

GIT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)" || {
  echo "ERROR: deploy.sh must run from a Git working tree" >&2
  exit 1
}
if [[ -n "$(git -C "$GIT_ROOT" status --porcelain --untracked-files=normal)" ]]; then
  echo "ERROR: working tree is dirty; commit or stash every change before deploying" >&2
  exit 1
fi
RELEASE_REF="${RELEASE_REF:-HEAD}"
RELEASE_SHA="$(git -C "$GIT_ROOT" rev-parse --verify "${RELEASE_REF}^{commit}")" || {
  echo "ERROR: RELEASE_REF is not a commit or tag: $RELEASE_REF" >&2
  exit 1
}
RELEASE_TAG="$(git -C "$GIT_ROOT" describe --tags --exact-match "$RELEASE_SHA" 2>/dev/null || true)"
RELEASED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

SSH="ssh -p $SSH_PORT"
SCP="scp -P $SSH_PORT"
if [[ -n "$SSH_KEY" ]]; then
  SSH_KEY="${SSH_KEY/#\~/$HOME}"
  if [[ ! -f "$SSH_KEY" ]]; then
    echo "ERROR: SSH_KEY not found: $SSH_KEY" >&2
    exit 1
  fi
  SSH="$SSH -i $SSH_KEY"
  SCP="$SCP -i $SSH_KEY"
fi

echo "==> Deploying shop to $VM_HOST:$REMOTE_DIR → $WEB_ROOT"

RELEASE_STAGE="$(mktemp -d -t trovara-shop-release.XXXXXX)"
REMOTE_RUNNER=""
cleanup() {
  rm -rf "$RELEASE_STAGE"
  [[ -z "$REMOTE_RUNNER" ]] || rm -f "$REMOTE_RUNNER"
}
trap cleanup EXIT
git -C "$GIT_ROOT" archive "$RELEASE_SHA" | tar -x -C "$RELEASE_STAGE"
node - "$RELEASE_STAGE/RELEASE.json" "$RELEASE_SHA" "$RELEASE_TAG" "$RELEASED_AT" <<'NODE'
const fs = require('node:fs')
const [file, sha, tag, releasedAt] = process.argv.slice(2)
fs.writeFileSync(file, `${JSON.stringify({
  schemaVersion: 1,
  sha,
  tag: tag || null,
  releasedAt,
  operation: 'deploy',
}, null, 2)}\n`, { mode: 0o644 })
NODE

echo "==> Syncing immutable release ${RELEASE_SHA}..."
rsync -az --delete \
  -e "$SSH" \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude '*.tsbuildinfo' \
  --exclude '.DS_Store' \
  --exclude '.cursor/' \
  "$RELEASE_STAGE/" "$VM_HOST:$REMOTE_DIR/"

REMOTE_RUNNER="$(mktemp -t trovara-shop-deploy.XXXXXX.sh)"
cat >"$REMOTE_RUNNER" <<REMOTE
#!/usr/bin/env bash
set -euo pipefail
cd "$REMOTE_DIR"

export NVM_DIR="\${NVM_DIR:-\$HOME/.nvm}"
if [[ ! -s "\$NVM_DIR/nvm.sh" ]]; then
  echo "ERROR: nvm is not installed for \$(id -un) at \$NVM_DIR" >&2
  exit 1
fi
# shellcheck disable=SC1091
source "\$NVM_DIR/nvm.sh"
nvm use 22
echo "==> [vm] node \$(node -v), npm \$(npm -v)"

echo "==> [vm] npm ci"
npm ci --include=dev

echo "==> [vm] lint + tests"
npm run lint
npm test

echo "==> [vm] dependency audit (high+ blocks deploy)"
npm audit --audit-level=high

echo "==> [vm] production build"
VITE_PUBLIC_MARKETING_URL="$VITE_PUBLIC_MARKETING_URL" \
VITE_TELEGRAM_CUSTOMER_BOT="$VITE_TELEGRAM_CUSTOMER_BOT" \
npm run build
cp RELEASE.json dist/RELEASE.json

echo "==> [vm] releasing Accounts SPA to $WEB_ROOT"
sudo rsync -a --delete "$REMOTE_DIR/dist/" "$WEB_ROOT/"
REMOTE

$SCP -q "$REMOTE_RUNNER" "$VM_HOST:/tmp/trovara-shop-deploy-remote.sh"
$SSH -t "$VM_HOST" 'bash /tmp/trovara-shop-deploy-remote.sh; rc=$?; rm -f /tmp/trovara-shop-deploy-remote.sh; exit $rc'

echo ""
echo "==> Done. Live at https://shop.trovara.farm"
echo "    (Hard-refresh if the browser shows an old build.)"
