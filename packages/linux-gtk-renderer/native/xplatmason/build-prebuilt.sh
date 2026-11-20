#!/usr/bin/env bash
# Reproducible producer for platforms/linux/prebuilt/<arch>/: compiles the
# pinned mason-c engine archive and this GTK facade inside the Ubuntu 24.04
# baseline image (see Dockerfile beside this script), then stages
# libxplatmason-gtk.so + XplatMason-1.0.typelib into platforms/linux/prebuilt.
#
#   ./build-prebuilt.sh <x86_64|aarch64> [path-to-nativescript-mason-checkout]
#
# Upstream's `nx run nativescript-masonkit:build.native.desktop` requires an
# Apple host at the pinned revision (packages/macos-appkit produces that
# artifact on macOS). Linux uses the documented recipe instead —
# `cargo rustc -p mason-c --lib --release --locked --crate-type staticlib`
# plus `prepareHeaders` from tools/mason-core/build-native.mjs — recorded in
# mason-core.pin.json and in the shipped prebuilt manifest.
#
# Cargo.lock is gitignored upstream, so the exact resolved dependency graph
# is committed beside the pin as mason-core.Cargo.lock and copied into the
# checkout before `--locked` compilation.
set -euo pipefail

ARCH="${1:?usage: $0 <x86_64|aarch64> [nativescript-mason checkout]}"
HERE="$(cd "$(dirname "$0")" && pwd)"
PKG="$(cd "$HERE/../.." && pwd)"
MASON="${2:-$HERE/../../../../research/nativescript-mason}"
PIN="$HERE/mason-core.pin.json"
LOCK="$HERE/mason-core.Cargo.lock"
PREBUILT="$PKG/platforms/linux/prebuilt"
LIB=libxplatmason-gtk.so
TYPELIB=XplatMason-1.0.typelib

case "$ARCH" in
	x86_64) TARGET=x86_64-unknown-linux-gnu; EMACHINE=62 ;;
	aarch64) TARGET=aarch64-unknown-linux-gnu; EMACHINE=183 ;;
	*) echo "unsupported arch $ARCH — expected x86_64 or aarch64 (uname -m names)" >&2; exit 1 ;;
esac

sha() { shasum -a 256 "$1" | cut -d' ' -f1; }
pin() { node -p "JSON.parse(require('fs').readFileSync('$PIN','utf8')).$1"; }

# ── 1. Verify the checkout and the dependency graph against the pin. ──
REVISION="$(git -C "$MASON" rev-parse HEAD 2>/dev/null || true)"
PIN_REVISION="$(pin revision)"
[ "$REVISION" = "$PIN_REVISION" ] || {
	echo "nativescript-mason checkout at ${REVISION:-none}; pin requires $PIN_REVISION" >&2
	exit 1
}

[ -f "$LOCK" ] || { echo "$LOCK missing — commit the pinned lockfile beside the pin" >&2; exit 1; }
[ "$(sha "$LOCK")" = "$(pin cargoLockSha256)" ] || {
	echo "$LOCK does not match pin cargoLockSha256" >&2
	exit 1
}
cp "$LOCK" "$MASON/Cargo.lock"

# ── 2. Build the pinned engine archive (documented staticlib recipe). ──
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

rustup run stable cargo rustc --manifest-path "$MASON/Cargo.toml" \
	-p mason-c --lib --release --locked --target "$TARGET" \
	--target-dir "$WORK/cargo-target" --crate-type staticlib
ARCHIVE="$WORK/cargo-target/$TARGET/release/libmason_c.a"

# prepareHeaders emits include/mason_native.h (+module.modulemap) in the
# layout upstream's desktop artifact — and build.sh — consume.
node -e "import('$MASON/tools/mason-core/build-native.mjs').then(m => m.prepareHeaders('$WORK/include'))"
HEADER="$WORK/include/mason_native.h"

# ── 3. Verify the engine bytes against the pin's per-target hashes. ──
ARCHIVE_SHA="$(sha "$ARCHIVE")"
HEADER_SHA="$(sha "$HEADER")"
PIN_ARCHIVE_SHA="$(pin "targets['$TARGET'].archiveSha256")"
PIN_HEADER_SHA="$(pin "targets['$TARGET'].headerSha256")"
if [ "$PIN_ARCHIVE_SHA" = "null" ]; then
	if [ "${XPLAT_MASON_PIN_RECORD:-}" = "1" ]; then
		node -e "
			const fs = require('fs')
			const pin = JSON.parse(fs.readFileSync('$PIN', 'utf8'))
			pin.targets['$TARGET'] = { archiveSha256: '$ARCHIVE_SHA', headerSha256: '$HEADER_SHA' }
			fs.writeFileSync('$PIN', JSON.stringify(pin, null, '\t') + '\n')
		"
		echo "recorded $TARGET hashes in the pin — commit the result"
		PIN_ARCHIVE_SHA="$ARCHIVE_SHA"
		PIN_HEADER_SHA="$HEADER_SHA"
	else
		echo "pin target $TARGET has no hashes — rerun with XPLAT_MASON_PIN_RECORD=1" >&2
		exit 1
	fi
fi
[ "$ARCHIVE_SHA" = "$PIN_ARCHIVE_SHA" ] || {
	echo "engine archive sha256 $ARCHIVE_SHA != pin $PIN_ARCHIVE_SHA for $TARGET" >&2
	exit 1
}
[ "$HEADER_SHA" = "$PIN_HEADER_SHA" ] || {
	echo "generated header sha256 $HEADER_SHA != pin $PIN_HEADER_SHA for $TARGET" >&2
	exit 1
}

# ── 4. Stage the engine in the layout build.sh consumes, then build. ──
CORE="$MASON/dist/native/mason-core/desktop/$TARGET"
mkdir -p "$CORE/include"
cp "$ARCHIVE" "$CORE/libMasonCore.a"
cp "$WORK/include/mason_native.h" "$WORK/include/module.modulemap" "$CORE/include/"
node - "$CORE/manifest.json" "$REVISION" "$ARCHIVE_SHA" "$HEADER_SHA" <<'NODE'
const [file, revision, archiveSha256, headerSha256] = process.argv.slice(2)
require('fs').writeFileSync(
	file,
	JSON.stringify(
		{
			mode: 'desktop',
			crate: 'mason-c',
			revision,
			toolchain: 'stable',
			targets: [require('path').basename(require('path').dirname(file))],
			headerSha256,
			cargoLockSha256: 'ae1730f204453c212d06d09398bb9b719b8a4f5081a69257fb07c758a54f3720',
			preparation:
				'cargo rustc -p mason-c --lib --release --locked --crate-type staticlib + prepareHeaders — upstream build.native.desktop requires an Apple host at this revision',
			archiveSha256,
		},
		null,
		2,
	),
)
NODE

XPLAT_MASON_CORE_TARGET="$TARGET" "$HERE/build.sh" "$MASON"

# ── 5. Verify the shipped ELF, then stage under platforms/linux/prebuilt. ──
EM="$(od -An -tx1 -j18 -N2 "$HERE/$LIB" | tr -d ' ')"
[ "$EM" = "$(printf '%02x%02x' $EMACHINE 0)" ] || {
	echo "ELF e_machine $EM != expected $(printf '%02x' $EMACHINE) for $ARCH" >&2
	exit 1
}
[ "$(readelf -d "$HERE/$LIB" | awk '/SONAME/{print $NF}' | tr -d '[]')" = "$LIB" ] || {
	echo "soname is not $LIB" >&2
	exit 1
}
if readelf -d "$HERE/$LIB" | grep -E 'RPATH|RUNPATH' | grep -q '/'; then
	echo "$LIB carries an absolute rpath — refusing to ship" >&2
	exit 1
fi

mkdir -p "$PREBUILT/$ARCH"
install -m 0755 "$HERE/$LIB" "$PREBUILT/$ARCH/$LIB"
install -m 0644 "$HERE/$TYPELIB" "$PREBUILT/$ARCH/$TYPELIB"

# ── 6. Record the build in the prebuilt manifest (one entry per arch). ──
node - "$PREBUILT/manifest.json" "$ARCH" "$REVISION" <<'NODE'
const [file, arch, revision] = process.argv.slice(2)
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const prebuilt = path.dirname(file)
const lib = `libxplatmason-gtk.so`
const typelib = `XplatMason-1.0.typelib`
const sha = (p) =>
	require('crypto').createHash('sha256').update(fs.readFileSync(path.join(prebuilt, arch, p))).digest('hex')
const pkg = (name) =>
	execSync(`dpkg-query -W '-f=\${Version}' ${name}`, { encoding: 'utf8' }).trim()

const manifest = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { baseline: null, architectures: {} }
manifest.baseline = {
	image: 'ubuntu:24.04',
	gtk: pkg('libgtk-4-dev'),
	'json-glib': pkg('libjson-glib-dev'),
	'minimum-glibc': '2.39',
}
manifest.architectures[arch] = {
	revision,
	toolchain: 'stable',
	rustc: execSync('rustc --version', { encoding: 'utf8' }).trim(),
	sha256: { [lib]: sha(lib), [typelib]: sha(typelib) },
}
fs.writeFileSync(file, JSON.stringify(manifest, null, '\t') + '\n')
NODE

echo "prebuilt[$ARCH]: $LIB + $TYPELIB → $PREBUILT/$ARCH (mason $REVISION, $TARGET)"
