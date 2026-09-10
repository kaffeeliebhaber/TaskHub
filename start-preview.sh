#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
if command -v node >/dev/null 2>&1; then
  taskhub_node="$(command -v node)"
else
  taskhub_node="${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$taskhub_node" ]]; then
  echo 'Node.js wurde nicht gefunden. Bitte Node.js ab Version 22 installieren.' >&2
  exit 1
fi
if [[ ! -f node_modules/vite/bin/vite.js ]]; then
  echo 'Die Projektpakete fehlen. Bitte nach Installation von Node.js und npm einmal npm ci ausführen.' >&2
  exit 1
fi
exec "$taskhub_node" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 1420
