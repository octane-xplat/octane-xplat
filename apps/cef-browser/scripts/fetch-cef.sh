#!/usr/bin/env bash
# Fetch the pinned CEF binary distribution and stage its headers for the
# platforms/macos leaf build. Idempotent; safe to re-run.
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CEF_VERSION="154.0.34+g14c5a08+chromium-154.0.8037.98"
DIST_DIR="$APP_ROOT/cef-dist/cef_binary_${CEF_VERSION}_macosarm64_minimal"
INCLUDE_TARGET="$APP_ROOT/platforms/macos/cef"
URL="https://cef-builds.spotifycdn.com/cef_binary_$(echo "$CEF_VERSION" | sed 's/+/%2B/g')_macosarm64_minimal.tar.bz2"

if [ ! -d "$DIST_DIR" ]; then
	mkdir -p "$APP_ROOT/cef-dist"
	cd "$APP_ROOT/cef-dist"
	if [ ! -f cef.tar.bz2 ]; then
		echo "[fetch-cef] downloading $URL"
		curl -fL -o cef.tar.bz2 "$URL"
	fi
	echo "[fetch-cef] extracting"
	tar -xjf cef.tar.bz2
fi

mkdir -p "$INCLUDE_TARGET"
echo "[fetch-cef] staging headers into platforms/macos/cef"
rm -rf "$INCLUDE_TARGET/include"
cp -R "$DIST_DIR/include" "$INCLUDE_TARGET/include"

echo "[fetch-cef] done: $DIST_DIR"
