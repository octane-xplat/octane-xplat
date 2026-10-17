#!/usr/bin/env bash
# Builds libxplatmason.dylib: the XPLMason ObjC facade statically linked
# against mason-c from triniwiz/nativescript-mason.
#
#   ./build.sh [path-to-nativescript-mason-checkout]
#
# The mason source is expected as a sibling checkout (e.g.
# research/nativescript-mason); pass the path explicitly when it lives
# elsewhere. The dylib lands in this directory.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
MASON="${1:-$HERE/../../../../research/nativescript-mason}"
OUT="$HERE/libxplatmason.dylib"

if [ ! -d "$MASON/crates/mason-c" ]; then
	echo "mason-c not found at $MASON" >&2
	exit 1
fi

cargo rustc --manifest-path "$MASON/Cargo.toml" -p mason-c --release --crate-type staticlib

clang -dynamiclib -fobjc-arc \
	-install_name "@rpath/libxplatmason.dylib" \
	-framework Foundation \
	-o "$OUT" \
	"$HERE/XPLMason.m" \
	"$MASON/target/release/libmason_c.a"

echo "built $OUT"
