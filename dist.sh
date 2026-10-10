#!/usr/bin/env bash
# Build a versioned copy of the web app for deployment in to site/:
#   ./dist.sh <num>   =>   site/Ripple<num>.html and site/ripple<num>/
set -euo pipefail

num=$1
DIR="$(pwd)"

echo "=== Building TypeScript app ==="
( cd "$DIR/ts" && npm run build )

rm -rf site
mkdir site
cp -r "$DIR/ts/dist/." site

( cd site
  mv ripple "ripple$num"

  # Ripple.html hardcodes references like "ripple/glMatrix-0.9.5.min.js" and
  # script src="./ripple/...js" pointing at the assets directory by name, since
  # it's a plain static file — fix those up to match the renamed directory.
  # The app's own runtime data fetches (setuplist.txt, examples/) don't need
  # this: they're resolved from the actual running script's URL at runtime
  # (see ts/ModuleBase.ts), so they find the renamed directory automatically.
  for f in *.html; do
    [ -f "$f" ] || continue
    sed -i.bak "s#ripple/#ripple$num/#g" "$f"
    rm -f "$f.bak"
  done

  # Ripple.html is the versioned entry point too, so it gets the same
  # per-version name as its assets directory.
  mv Ripple.html "Ripple$num.html"
)

echo "=== Done: site/ripple$num (entry: site/Ripple$num.html) ==="
