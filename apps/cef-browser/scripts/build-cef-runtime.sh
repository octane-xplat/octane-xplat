#!/usr/bin/env bash
# Assemble cef-runtime/XplatCefSpike.app — the macOS bundle skeleton CEF
# expects: Contents/Frameworks/<framework + five helper bundles>. The Xplat
# host binary is NOT inside this bundle; CefSettings.main_bundle_path points
# CEF at it anyway.
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$(echo "$APP_ROOT"/cef-dist/cef_binary_*_macosarm64_minimal)"
RUNTIME="$APP_ROOT/cef-runtime"
BUNDLE="$RUNTIME/XplatCefSpike.app"
EXE_NAME="XplatCefSpike"
BUNDLE_ID="org.octane-xplat.cef-spike"
HELPER_SRC="$APP_ROOT/platforms/macos/helper/cef_helper_main.m"

[ -d "$DIST_DIR/Release/Chromium Embedded Framework.framework" ] || {
	echo "error: run scripts/fetch-cef.sh first" >&2
	exit 1
}

write_plist() {
	local path="$1" name="$2" id="$3" exe="$4" background="${5:-0}"
	cat >"$path" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key><string>en</string>
	<key>CFBundleExecutable</key><string>$exe</string>
	<key>CFBundleIdentifier</key><string>$id</string>
	<key>CFBundleName</key><string>$name</string>
	<key>CFBundlePackageType</key><string>APPL</string>
	<key>CFBundleShortVersionString</key><string>0.1.0</string>
	<key>CFBundleVersion</key><string>1</string>
	<key>LSMinimumSystemVersion</key><string>13.5</string>
	<key>LSUIElement</key><$([ "$background" = 1 ] && echo true || echo false)/>
</dict>
</plist>
EOF
}

echo "[cef-runtime] assembling $BUNDLE"
rm -rf "$RUNTIME"
mkdir -p "$BUNDLE/Contents/MacOS" "$BUNDLE/Contents/Frameworks" "$RUNTIME/cache"

# Main-bundle metadata + a stub executable so the bundle is well-formed.
write_plist "$BUNDLE/Contents/Info.plist" "$EXE_NAME" "$BUNDLE_ID" "$EXE_NAME" 0
echo -n "APPL????" >"$BUNDLE/Contents/PkgInfo"

# The browser process must be bundled for the V2 seatbelt: the serialized
# sandbox policy is parameterized on the main bundle path, which requires a
# real NSBundle. Use the JavaScriptCore host as the bundle executable so the
# app can be launched in place.
JSC_HOST="${JSC_HOST:-$APP_ROOT/../../packages/cli/src/macos/jsc-host/prebuilt/macos-arm64/host}"
if [ -x "$JSC_HOST" ]; then
	cp "$JSC_HOST" "$BUNDLE/Contents/MacOS/$EXE_NAME"
else
	xcrun clang -x objective-c -framework Foundation -O2 \
		-target arm64-apple-macos13.5 \
		-o "$BUNDLE/Contents/MacOS/$EXE_NAME" - <<'EOF'
int main() { return 0; }
EOF
fi

cp -R "$DIST_DIR/Release/Chromium Embedded Framework.framework" \
	"$BUNDLE/Contents/Frameworks/Chromium Embedded Framework.framework"

# Helper executable, built once and copied into each helper flavor.
HELPER_BIN="$(mktemp -d)/helper"
xcrun clang -framework Foundation -O2 -target arm64-apple-macos13.5 \
	"$HELPER_SRC" -o "$HELPER_BIN"

make_helper() {
	local suffix="$1" bname="$2" id_suffix="$3"
	local helper_app="$BUNDLE/Contents/Frameworks/$bname.app"
	mkdir -p "$helper_app/Contents/MacOS"
	write_plist "$helper_app/Contents/Info.plist" "$bname" "$BUNDLE_ID.helper$id_suffix" "$bname" 1
	echo -n "APPL????" >"$helper_app/Contents/PkgInfo"
	cp "$HELPER_BIN" "$helper_app/Contents/MacOS/$bname"
	codesign --force --sign - "$helper_app" 2>/dev/null || true
}

make_helper "" "$EXE_NAME Helper" ""
make_helper " (Alerts)" "$EXE_NAME Helper (Alerts)" ".alerts"
make_helper " (GPU)" "$EXE_NAME Helper (GPU)" ".gpu"
make_helper " (Plugin)" "$EXE_NAME Helper (Plugin)" ".plugin"
make_helper " (Renderer)" "$EXE_NAME Helper (Renderer)" ".renderer"

codesign --force --deep --sign - "$BUNDLE" 2>/dev/null || true
rm -f "$HELPER_BIN"

echo "[cef-runtime] ready: $BUNDLE"
