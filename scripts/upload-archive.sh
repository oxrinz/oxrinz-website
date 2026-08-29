#!/usr/bin/env bash
# Syncs archive collections (originals + generated thumbnails) to Cloudflare R2.
#
#   scripts/upload-archive.sh              # every collection in archive.config.json
#   scripts/upload-archive.sh muramasa     # just these ones
#   scripts/upload-archive.sh --dry-run    # show what would change
#
# Everything lands in ONE bucket, prefixed per collection:
#   <id>/full/<path>        original
#   <id>/thumb/<path>.webp  thumbnail
#
# Credentials come from scripts/.archive.env (gitignored) or the environment:
#   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(dirname "$here")"
[ -f "$here/.archive.env" ] && . "$here/.archive.env"

: "${ARCHIVE_CACHE:=$HOME/.cache/oxrinz-archive}"

ids=()
opts=()
for arg in "$@"; do
  case "$arg" in
    -*) opts+=("$arg") ;;
    *) ids+=("$arg") ;;
  esac
done

for var in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET; do
  if [ -z "${!var:-}" ]; then
    echo "missing $var — set it in scripts/.archive.env or the environment" >&2
    exit 1
  fi
done

command -v rclone >/dev/null || { echo "rclone not installed — brew install rclone" >&2; exit 1; }

# Remote is defined purely through env vars, so there is no rclone config file to set up.
export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true

flags=(
  # The scanner ignores dotfiles, so the bucket must not carry them either
  # (.DS_Store would otherwise ride along and never be referenced).
  --filter "- .*"
  --transfers 24
  --checkers 32
  --s3-chunk-size 16M
  --header-upload "Cache-Control: public, max-age=31536000, immutable"
  --progress
  --stats-one-line
  ${opts[@]+"${opts[@]}"}
)

# Collection id + source folder pairs, straight out of archive.config.json.
export ROOT="$root"
rows=$(
  node -e '
    const fs = require("node:fs"), os = require("node:os"), path = require("node:path");
    const want = process.argv.slice(1);
    const { collections = [] } = JSON.parse(fs.readFileSync(process.env.ROOT + "/archive.config.json", "utf8"));
    const expand = (p) => (p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : path.resolve(p));
    for (const c of collections) {
      if (want.length && !want.includes(c.id)) continue;
      console.log([c.id, expand(c.src)].join("\t"));
    }
  ' ${ids[@]+"${ids[@]}"}
)

[ -n "$rows" ] || { echo "no collections matched" >&2; exit 1; }

while IFS=$'\t' read -r id src; do
  thumbs="$ARCHIVE_CACHE/$id"

  [ -d "$src" ] || { echo "! $id: source folder not found: $src" >&2; exit 1; }
  [ -d "$thumbs" ] || { echo "! $id: thumbnails not found: $thumbs — run build-archive.mjs first" >&2; exit 1; }

  echo "==> $id originals  -> r2:$R2_BUCKET/$id/full"
  rclone copy "$src" "r2:$R2_BUCKET/$id/full" "${flags[@]}"

  echo "==> $id thumbnails -> r2:$R2_BUCKET/$id/thumb"
  rclone copy "$thumbs" "r2:$R2_BUCKET/$id/thumb" "${flags[@]}"
done <<< "$rows"

echo "done. bucket URL goes in src/lib/archive.ts (ARCHIVE_BASE)."
