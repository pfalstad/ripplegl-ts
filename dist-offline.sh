#!/usr/bin/env bash
# Build the web app in to site/ for the Electron (offline) version, unversioned.
set -euo pipefail

DIR="$(pwd)"

echo "=== Building TypeScript app ==="
( cd "$DIR/ts" && npm run build )

rm -rf site
mkdir site
cp -r "$DIR/ts/dist/." site

echo "=== Done: site/ (entry: site/Ripple.html) ==="
