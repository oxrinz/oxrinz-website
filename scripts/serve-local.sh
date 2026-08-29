#!/usr/bin/env bash
# Serves the archive's images straight off local disk, in the same key layout R2 uses,
# so `npm run dev` shows a fully working browser before anything is uploaded.
#
#   scripts/serve-local.sh [port]     # default 8792
#
# src/lib/archive.ts points at this automatically in dev.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(dirname "$here")"
port="${1:-8792}"
: "${ARCHIVE_CACHE:=$HOME/.cache/oxrinz-archive}"

tree="$root/.archive-local"
rm -rf "$tree"
mkdir -p "$tree"

export ROOT="$root"
node -e '
  const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
  const { collections = [] } = JSON.parse(fs.readFileSync(process.env.ROOT + "/archive.config.json", "utf8"));
  const expand = (p) => (p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : path.resolve(p));
  for (const c of collections) console.log([c.id, expand(c.src)].join("\t"));
' | while IFS=$'\t' read -r id src; do
  mkdir -p "$tree/$id"
  ln -sfn "$src" "$tree/$id/full"
  ln -sfn "$ARCHIVE_CACHE/$id" "$tree/$id/thumb"
  echo "serving $id from $src"
done

echo "==> http://localhost:$port  (ctrl-c to stop)"
cd "$tree" && exec python3 -m http.server "$port" --bind 127.0.0.1
