#!/bin/zsh
set -euo pipefail

port="${1:-4173}"
cd "$(dirname "$0")"
print "Open http://127.0.0.1:${port}/ in a browser."
exec python3 -m http.server "$port"
