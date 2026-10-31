#!/usr/bin/env bash
# Builds libxplatmason.dylib: the XPLMason ObjC facade statically linked
# against mason-c from octane-xplat/nativescript-mason.
#
#   ./build.sh [path-to-nativescript-mason-checkout]
#
# The checkout is expected at research/nativescript-mason; pass the path
# explicitly when it lives elsewhere. The facade consumes the checkout's
# dist/native/mason-core/desktop/<triple>/ archive plus its generated
# mason_native.h — produced upstream by:
#
#   rustup run stable cargo generate-lockfile   # once; Cargo.lock is gitignored
#   pnpm exec nx run nativescript-mason-core:build.native.desktop
#
# This script runs that nx target when the artifacts are missing, then
# verifies revision, toolchain, and archive/header bytes against the pin in
# mason-core.pin.json before linking.
#
# Packaged macOS apps ship universal binaries, so the dylib needs arm64 and
# x86_64 slices. The arm64 slice links the pinned archive; upstream ships no
# x86_64-apple-darwin desktop target yet, so that slice is built from the
# same pinned revision with cargo (see .agents/docs/notes/macos-mason-engine.md).
# The universal dylib lands in platforms/macos/prebuilt/ and is committed
# with the package.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PKG="$(cd "$HERE/../.." && pwd)"
MASON="${1:-$HERE/../../../../research/nativescript-mason}"
PIN="$HERE/mason-core.pin.json"
PREBUILT="$PKG/platforms/macos/prebuilt"
OUT="$PREBUILT/libxplatmason.dylib"
DESKTOP="$MASON/dist/native/mason-core/desktop"
TRIPLE=aarch64-apple-darwin
X86_TARGET=x86_64-apple-darwin

if [ ! -d "$MASON" ]; then
	echo "nativescript-mason checkout not found at $MASON" >&2
	exit 1
fi

if [ ! -f "$DESKTOP/manifest.json" ]; then
	echo "desktop engine artifacts missing; building them in $MASON" >&2
	if [ ! -f "$MASON/Cargo.lock" ]; then
		(cd "$MASON" && rustup run stable cargo generate-lockfile)
	fi
	(cd "$MASON" && pnpm exec nx run nativescript-mason-core:build.native.desktop)
fi

# Verify the consumed artifacts against the pin: the checkout's dist manifest
# must sit at the pinned revision/toolchain, the target entry's recorded
# hashes must match the pinned bytes, and the files on disk must match the
# manifest they came from. A byte mismatch means the engine is not the pinned
# artifact — re-pin deliberately by updating mason-core.pin.json.
node --input-type=module - "$PIN" "$DESKTOP" "$TRIPLE" <<'EOF'
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const [pinPath, desktop, triple] = process.argv.slice(2);
const pin = JSON.parse(readFileSync(pinPath, 'utf8'));
const manifest = JSON.parse(readFileSync(join(desktop, 'manifest.json'), 'utf8'));
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const fail = (message) => {
	console.error(`[xplatmason] ${message}`);
	process.exit(1);
};

if (manifest.mode !== 'desktop' || manifest.crate !== pin.crate)
	fail(`${desktop}/manifest.json is not a mason-c desktop artifact manifest`);
if (manifest.revision !== pin.revision)
	fail(`engine revision ${manifest.revision} does not match the pinned ${pin.revision} — check out the pinned revision or update mason-core.pin.json`);
if (manifest.toolchain !== pin.toolchain)
	fail(`engine toolchain ${manifest.toolchain} does not match the pinned ${pin.toolchain}`);

const artifact = manifest.artifacts?.find((entry) => entry.target === pin.target);
if (!artifact || artifact.target !== triple) fail(`no ${triple} artifact in the desktop manifest`);

const archive = join(desktop, artifact.path);
const header = join(desktop, artifact.header);
const archiveSha = sha256(archive);
const headerSha = sha256(header);
if (archiveSha !== artifact.sha256) fail(`${artifact.path} bytes differ from its manifest hash`);
if (headerSha !== artifact.headerSha256) fail(`${artifact.header} bytes differ from its manifest hash`);
if (archiveSha !== pin.archiveSha256)
	fail(`the consumed archive is not the pinned artifact (sha256 ${archiveSha}, pinned ${pin.archiveSha256}) — rebuild ${pin.revision} or update mason-core.pin.json`);
if (headerSha !== pin.headerSha256)
	fail(`the consumed header is not the pinned artifact (sha256 ${headerSha}, pinned ${pin.headerSha256})`);

console.log(`[xplatmason] verified ${triple} archive + header against pin ${pin.revision}`);
EOF

REVISION="$(git -C "$MASON" rev-parse HEAD)"
PIN_REVISION="$(node -p "JSON.parse(require('fs').readFileSync('$PIN','utf8')).revision")"
if [ "$REVISION" != "$PIN_REVISION" ]; then
	echo "checkout is at $REVISION, not the pinned $PIN_REVISION — the x86_64" >&2
	echo "slice is built from crate source at the pinned revision" >&2
	exit 1
fi

mkdir -p "$PREBUILT"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

# arm64 slice: the pinned desktop archive.
clang -dynamiclib -fobjc-arc \
	-target arm64-apple-macos13.5 \
	-install_name "@rpath/libxplatmason.dylib" \
	-I"$DESKTOP/$TRIPLE/include" \
	-o "$STAGING/libxplatmason-arm64.dylib" \
	"$HERE/XPLMason.m" \
	"$DESKTOP/$TRIPLE/libMasonCore.a" \
	-framework Foundation -framework CoreFoundation -framework AppKit \
	-liconv -lresolv

# x86_64 slice: upstream ships no x86_64-apple-darwin desktop target, so this
# slice builds mason-c from the pinned checkout instead of consuming a pinned
# archive. It still compiles against the generated header — no hand-declared
# externs.
MACOSX_DEPLOYMENT_TARGET=13.5 cargo rustc --manifest-path "$MASON/Cargo.toml" \
	-p mason-c --release --target "$X86_TARGET" --crate-type staticlib

clang -dynamiclib -fobjc-arc \
	-target x86_64-apple-macos13.5 \
	-install_name "@rpath/libxplatmason.dylib" \
	-I"$DESKTOP/$TRIPLE/include" \
	-o "$STAGING/libxplatmason-x86_64.dylib" \
	"$HERE/XPLMason.m" \
	"$MASON/target/$X86_TARGET/release/libmason_c.a" \
	-framework Foundation -framework CoreFoundation -framework AppKit \
	-liconv -lresolv

lipo -create \
	"$STAGING/libxplatmason-arm64.dylib" \
	"$STAGING/libxplatmason-x86_64.dylib" \
	-output "$OUT"

SHA="$(shasum -a 256 "$OUT" | cut -d' ' -f1)"

node --input-type=module - "$PIN" "$DESKTOP" "$TRIPLE" "$SHA" > "$PREBUILT/manifest.json" <<'EOF'
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const [pinPath, desktop, triple, dylibSha] = process.argv.slice(2);
const pin = JSON.parse(readFileSync(pinPath, 'utf8'));
const manifest = JSON.parse(readFileSync(join(desktop, 'manifest.json'), 'utf8'));
console.log(JSON.stringify({
	library: 'libxplatmason.dylib',
	architectures: ['arm64', 'x86_64'],
	minimumSystemVersion: '13.5',
	source: {
		facade: 'native/xplatmason/XPLMason.m',
		mason: {
			repository: pin.repository,
			revision: pin.revision,
			crate: pin.crate,
			toolchain: pin.toolchain,
			pin: 'native/xplatmason/mason-core.pin.json',
		},
		engine: {
			artifact: `dist/native/mason-core/desktop/${triple}`,
			rustc: manifest.rustc.split('\n')[0],
			archiveSha256: pin.archiveSha256,
			headerSha256: pin.headerSha256,
			headerSourceSha256: pin.headerSourceSha256,
			cargoLockSha256: manifest.cargoLockSha256,
			slices: {
				arm64: `pinned archive ${triple}`,
				x86_64: 'built from crate source at the pinned revision — upstream ships no x86_64-apple-darwin desktop target',
			},
		},
	},
	sha256: { 'libxplatmason.dylib': dylibSha },
}, null, '\t'));
EOF

echo "built $OUT"
echo "wrote $PREBUILT/manifest.json (mason pin $PIN_REVISION, sha256 $SHA)"
