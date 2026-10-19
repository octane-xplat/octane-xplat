#!/usr/bin/env bash
# Builds the mason-c binding for the GTK renderer:
#   libxplatmason-gtk.{so,dylib} — the xplatmason.c facade statically linked
#     against mason-c from triniwiz/nativescript-mason
#   XplatMason-1.0.{gir,typelib} — the introspection data GJS binds through
#
#   ./build.sh [path-to-nativescript-mason-checkout]
#
# The mason source is expected as a sibling checkout (e.g.
# research/nativescript-mason); pass the path explicitly when it lives
# elsewhere. Requires: cargo, a C compiler, pkg-config, gtk4, json-glib-1.0,
# and gobject-introspection (g-ir-scanner + g-ir-compiler).
# Artifacts land in this directory.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
MASON="${1:-$HERE/../../../../research/nativescript-mason}"

case "$(uname -s)" in
	# mason-c's Apple code paths reference the ObjC runtime — same reason
	# the macOS facade links Foundation.
	Darwin) LIB="libxplatmason-gtk.dylib"; EXTRA_LIBS="-framework Foundation" ;;
	*) LIB="libxplatmason-gtk.so"; EXTRA_LIBS="" ;;
esac

if [ ! -d "$MASON/crates/mason-c" ]; then
	echo "mason-c not found at $MASON" >&2
	exit 1
fi

cargo rustc --manifest-path "$MASON/Cargo.toml" -p mason-c --release --crate-type staticlib

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
cc -shared -fPIC -O2 -o "$HERE/$LIB" \
	"$HERE/xplatmason.c" \
	"$MASON/target/release/libmason_c.a" \
	$PKG_CFLAGS $PKG_LIBS $EXTRA_LIBS

# Scan the facade into a GIR. The gir's shared-library attribute is what
# the typelib dlopens at bind time; g-ir-scanner only records names it can
# resolve through -L, so stamp the absolute path in afterwards — the
# in-tree artifact then binds without LD_LIBRARY_PATH/dyld bookkeeping.
# A system install should rebuild or ship a relative soname instead.
# shellcheck disable=SC2086
g-ir-scanner --quiet --warn-all \
	--namespace=XplatMason --nsversion=1.0 \
	--symbol-prefix=xplat_mason --identifier-prefix=XplatMason \
	--include=Gtk-4.0 \
	--library=xplatmason-gtk -L"$HERE" \
	-I"$HERE" \
	$PKG_CFLAGS \
	-o "$HERE/XplatMason-1.0.gir" \
	"$HERE/xplatmason.h" "$HERE/xplatmason.c"

sed -i.bak "s|shared-library=\"[^\"]*\"|shared-library=\"$HERE/$LIB\"|" "$HERE/XplatMason-1.0.gir" && rm "$HERE/XplatMason-1.0.gir.bak"

g-ir-compiler "$HERE/XplatMason-1.0.gir" -o "$HERE/XplatMason-1.0.typelib"

echo "built $HERE/$LIB"
echo "built $HERE/XplatMason-1.0.typelib"
