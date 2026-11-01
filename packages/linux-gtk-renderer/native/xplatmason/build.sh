#!/usr/bin/env bash
# Builds the mason-c binding for the GTK renderer:
#   libxplatmason-gtk.{so,dylib} — the xplatmason.c facade statically linked
#     against the pinned MasonCore engine archive
#   XplatMason-1.0.{gir,typelib} — the introspection data GJS binds through
#
#   ./build.sh [path-to-nativescript-mason-checkout]
#
# Consumes the prebuilt engine artifact the mason-core native build ships at
#   $MASON/dist/native/mason-core/<mode>/<target-triple>/
# (libMasonCore.a + include/mason_native.h + manifest.json) — no cargo build
# and no hand-declared C functions on this side. The default mode is
# "desktop" and the default triple is this machine's rustc host triple;
# XPLAT_MASON_CORE_MODE / XPLAT_MASON_CORE_TARGET override both (e.g.
# XPLAT_MASON_CORE_MODE=host uses the macOS dev-host archive). Produce the
# artifact in the mason checkout first:
#   rustup run stable cargo generate-lockfile
#   bun run nx run nativescript-mason-core:build.native.desktop
#
# Requires: a C compiler, pkg-config, gtk4, json-glib-1.0, and
# gobject-introspection (g-ir-scanner + g-ir-compiler). Artifacts land in
# this directory; manifest.json records the consumed archive's pin so the
# build is reproducible. The gir/typelib bind the facade by soname only —
# nothing machine-absolute is stamped into the artifacts.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
MASON="${1:-$HERE/../../../../research/nativescript-mason}"
MODE="${XPLAT_MASON_CORE_MODE:-desktop}"
TARGET="${XPLAT_MASON_CORE_TARGET:-}"
if [ -z "$TARGET" ]; then
	TARGET="$(rustc -vV 2>/dev/null | sed -n 's/^host: //p')"
	TARGET="${TARGET:-x86_64-unknown-linux-gnu}"
fi
CORE="$MASON/dist/native/mason-core/$MODE/$TARGET"
CORE_ROOT="$MASON/dist/native/mason-core/$MODE"

case "$(uname -s)" in
	# mason-c's Apple code paths reference the ObjC runtime — same reason
	# the macOS facade links Foundation.
	Darwin) LIB="libxplatmason-gtk.dylib"; EXTRA_LIBS="-framework Foundation" ;;
	*) LIB="libxplatmason-gtk.so"; EXTRA_LIBS="" ;;
esac
# Keep the library's own recorded name relocatable too — an @rpath install
# name on Darwin, an unversioned soname elsewhere. Consumers resolve it
# through the GIRepository library path, not a baked-in directory.
case "$(uname -s)" in
	Darwin) LIB_NAME_FLAGS="-install_name @rpath/$LIB" ;;
	*) LIB_NAME_FLAGS="-Wl,-soname,$LIB" ;;
esac

if [ ! -f "$CORE/libMasonCore.a" ]; then
	echo "MasonCore engine archive not found at $CORE" >&2
	echo "build it in the mason checkout: nx run nativescript-mason-core:build.native.$MODE" >&2
	exit 1
fi
# include/ and manifest.json may sit at the artifact dir (desktop layout) or
# the mode root (host/ios layout) — accept either.
INCLUDE="$CORE/include"
[ -f "$INCLUDE/mason_native.h" ] || INCLUDE="$CORE_ROOT/include"
CORE_MANIFEST="$CORE/manifest.json"
[ -f "$CORE_MANIFEST" ] || CORE_MANIFEST="$CORE_ROOT/manifest.json"
if [ ! -f "$INCLUDE/mason_native.h" ] || [ ! -f "$CORE_MANIFEST" ]; then
	echo "incomplete pinned artifact under $CORE_ROOT — need mason_native.h + manifest.json" >&2
	exit 1
fi

PKG_CFLAGS="$(pkg-config --cflags gtk4 json-glib-1.0)"
PKG_LIBS="$(pkg-config --libs gtk4 json-glib-1.0)"

# Locate Gtk-4.0.gir for the scanner's --include. Distros keep girs under
# the default data dirs; Homebrew puts them in its own share dir.
GTK_PREFIX="$(pkg-config --variable=prefix gtk4)"
GIR_DIR=""
# Prefer merged gir dirs (every package's girs together) over the gtk4
# prefix's own — Gtk-4.0.gir pulls Gdk/GdkPixbuf girs that live elsewhere.
for dir in /usr/share/gir-1.0 /usr/local/share/gir-1.0 /opt/homebrew/share/gir-1.0 "$GTK_PREFIX/share/gir-1.0"; do
	if [ -f "$dir/Gtk-4.0.gir" ]; then
		GIR_DIR="$dir"
		break
	fi
done
if [ -z "$GIR_DIR" ]; then
	echo "Gtk-4.0.gir not found — install gtk4 introspection data" >&2
	exit 1
fi
# g-ir-scanner resolves --include through XDG_DATA_DIRS' gir-1.0 entries.
export XDG_DATA_DIRS="${GIR_DIR%/gir-1.0}:${XDG_DATA_DIRS:-/usr/local/share:/usr/share}"

# shellcheck disable=SC2086 # pkg-config output must word-split into cc args
cc -shared -fPIC -O2 -o "$HERE/$LIB" $LIB_NAME_FLAGS \
	"$HERE/xplatmason.c" \
	"$CORE/libMasonCore.a" \
	-I"$INCLUDE" \
	$PKG_CFLAGS $PKG_LIBS $EXTRA_LIBS

# Scan the facade into a GIR. The gir's shared-library attribute is what
# the typelib dlopens at bind time; recording the bare soname keeps the
# artifact relocatable — girepository searches the typelib's own directory,
# then the loader paths, so a packaged app can ship lib+typelib together.
# shellcheck disable=SC2086
g-ir-scanner --quiet --warn-all \
	--namespace=XplatMason --nsversion=1.0 \
	--symbol-prefix=xplat_mason --identifier-prefix=XplatMason \
	--include=Gtk-4.0 \
	--library=xplatmason-gtk -L"$HERE" \
	-I"$HERE" -I"$INCLUDE" \
	--cflags-begin $PKG_CFLAGS --cflags-end \
	-o "$HERE/XplatMason-1.0.gir" \
	"$HERE/xplatmason.h" "$HERE/xplatmason.c"

sed -i.bak "s|shared-library=\"[^\"]*\"|shared-library=\"$LIB\"|" "$HERE/XplatMason-1.0.gir" && rm "$HERE/XplatMason-1.0.gir.bak"

g-ir-compiler "$HERE/XplatMason-1.0.gir" -o "$HERE/XplatMason-1.0.typelib"

# Record the consumed pin — the artifact's own manifest carries the mason
# revision, toolchain, lockfile/header/archive hashes; copy it verbatim so
# this build can be reproduced from the same inputs.
node - "$CORE" "$CORE_MANIFEST" "$HERE" "$LIB" "$MODE" "$TARGET" <<'EOF'
const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { relative } = require('node:path');
const [core, coreManifestPath, here, lib, mode, target] = process.argv.slice(2);
const hash = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const consumed = JSON.parse(readFileSync(coreManifestPath, 'utf8'));
const manifest = {
	facade: 'native/xplatmason/xplatmason.c',
	library: lib,
	gir: 'XplatMason-1.0.gir',
	typelib: 'XplatMason-1.0.typelib',
	mason: {
		artifactDir: relative(here, core),
		manifest: relative(here, coreManifestPath),
		revision: consumed.revision ?? null,
		crate: consumed.crate ?? 'mason-c',
		toolchain: consumed.toolchain ?? null,
		mode: consumed.mode ?? null,
		targets: consumed.targets ?? null,
		headerSha256: consumed.headerSha256 ?? null,
		cargoLockSha256: consumed.cargoLockSha256 ?? null,
	},
	sha256: {
		[lib]: hash(`${here}/${lib}`),
		'XplatMason-1.0.gir': hash(`${here}/XplatMason-1.0.gir`),
		'XplatMason-1.0.typelib': hash(`${here}/XplatMason-1.0.typelib`),
	},
};
writeFileSync(`${here}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote ${here}/manifest.json (consumed ${mode}/${target}, mason ${manifest.mason.revision ?? 'unknown'})`);
EOF

echo "built $HERE/$LIB"
echo "built $HERE/XplatMason-1.0.typelib"
