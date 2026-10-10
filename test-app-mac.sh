#!/usr/bin/env bash
# Build the offline version and install it in to offline/mac-dmg/Ripple.app
# for a test run, without building a dmg.  Then run it with:
#   open offline/mac-dmg/Ripple.app
# or, to see console output:
#   offline/mac-dmg/Ripple.app/Contents/MacOS/Ripple
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$DIR"
./dist-offline.sh

cd offline
rm -rf mac-dmg/Ripple.app/Contents/Resources/app/war mac-dmg/Ripple.app/Contents/Resources/app/dist
cp -r ../site mac-dmg/Ripple.app/Contents/Resources/app/war
cp ../app/* mac-dmg/Ripple.app/Contents/Resources/app
xattr -cr mac-dmg/Ripple.app

echo "=== Installed in offline/mac-dmg/Ripple.app ==="
