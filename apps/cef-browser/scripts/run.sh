#!/usr/bin/env bash
# Direct host launch — rebuilds the app bundle + native leaf, then runs the
# bundled JavaScriptCore host (XplatCefSpike.app/Contents/MacOS) with the
# assembled bootstrap. Equivalent to `xplat dev --targets macos` minus the
# watcher, but easier to capture logs.
#
# The browser process MUST run from inside XplatCefSpike.app when the sandbox
# is enabled: Chromium's V2 seatbelt policy is parameterized on the main
# bundle, which only resolves for a bundled executable.
#
# Env flags (all optional):
#   XPLAT_CEF_NO_SANDBOX=1   disable the renderer/utility sandbox
#   XPLAT_CEF_IN_PROCESS_GPU=1  run GPU work in the browser process
#                             (required with sandbox on for the spike)
#   XPLAT_CEF_DISABLE_GPU=1  --disable-gpu
#   XPLAT_CEF_CBTRACE=1      log every CEF callback entry
#   XPLAT_CEF_REFTRACE=1     log handler add_ref/release balance
#   XPLAT_CEF_HANDLERS=list  enable only named client handlers
#                           (display,load,focus; life span is always on)
#   XPLAT_CEF_SINGLE_PROCESS=1 / XPLAT_CEF_IN_PROCESS_RENDERER=1
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$APP_ROOT/../.." && pwd)"
PREBUILT="$REPO_ROOT/packages/cli/src/macos/jsc-host/prebuilt/macos-arm64"

cd "$APP_ROOT"
pnpm exec vite build --config vite.dev.config.mjs
bash scripts/build-cef-runtime.sh

ARTIFACT_JSON="$(node -e "
import('$REPO_ROOT/packages/cli/src/macos/native.mjs').then(async (m) => {
  const artifact = await m.buildMacOSNative('$APP_ROOT', {})
  await m.writeNativeBootstrap(artifact, 'dist/dev/bootstrap.js')
  console.log(artifact.metadata)
})")"

METADATA="$(echo "$ARTIFACT_JSON" | tail -1)"
echo "[run] metadata: $METADATA"

cd "$APP_ROOT"
exec env OCTANE_MACOS_EXTERNAL_RUNLOOP=1 NODE_ENV=development \
	"$APP_ROOT/cef-runtime/XplatCefSpike.app/Contents/MacOS/XplatCefSpike" \
	"$PREBUILT/NativeScript.framework/Versions/A/NativeScript" \
	dist/dev/app.cjs \
	"$METADATA" \
	dist/dev/bootstrap.js
