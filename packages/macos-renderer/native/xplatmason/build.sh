#!/usr/bin/env bash
# Builds libxplatmason.dylib: the XPLMason ObjC facade statically linked
# against mason-c from octane-xplat/nativescript-mason.
#
#   ./build.sh [path-to-nativescript-mason-checkout]
#
# The mason source is expected at research/nativescript-mason pinned to the
# revision recorded in platforms/macos/prebuilt/manifest.json; pass the path
# explicitly when it lives elsewhere. The dylib lands in
# platforms/macos/prebuilt/ and is committed with the package.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PKG="$(cd "$HERE/../.." && pwd)"
MASON="${1:-$HERE/../../../../research/nativescript-mason}"
PREBUILT="$PKG/platforms/macos/prebuilt"
OUT="$PREBUILT/libxplatmason.dylib"

if [ ! -d "$MASON/crates/mason-c" ]; then
	echo "mason-c not found at $MASON" >&2
	exit 1
fi

mkdir -p "$PREBUILT"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

for pair in "arm64 aarch64-apple-darwin" "x86_64 x86_64-apple-darwin"; do
	set -- $pair
	ARCH="$1"
	TARGET="$2"

	MACOSX_DEPLOYMENT_TARGET=13.5 cargo rustc --manifest-path "$MASON/Cargo.toml" \
		-p mason-c --release --target "$TARGET" --crate-type staticlib

	clang -dynamiclib -fobjc-arc \
		-target "$ARCH-apple-macos13.5" \
		-install_name "@rpath/libxplatmason.dylib" \
		-framework Foundation -framework AppKit \
		-o "$STAGING/libxplatmason-$ARCH.dylib" \
		"$HERE/XPLMason.m" \
		"$MASON/target/$TARGET/release/libmason_c.a"
done

lipo -create \
	"$STAGING/libxplatmason-arm64.dylib" \
	"$STAGING/libxplatmason-x86_64.dylib" \
	-output "$OUT"

SHA="$(shasum -a 256 "$OUT" | cut -d' ' -f1)"
REVISION="$(git -C "$MASON" rev-parse HEAD)"

cat > "$PREBUILT/manifest.json" <<EOF
{
	"library": "libxplatmason.dylib",
	"architectures": ["arm64", "x86_64"],
	"minimumSystemVersion": "13.5",
	"source": {
		"facade": "native/xplatmason/XPLMason.m",
		"mason": {
			"repository": "https://github.com/octane-xplat/nativescript-mason",
			"revision": "$REVISION",
			"crate": "mason-c"
		}
	},
	"sha256": {
		"libxplatmason.dylib": "$SHA"
	}
}
EOF

echo "built $OUT"
echo "wrote $PREBUILT/manifest.json (mason $REVISION, sha256 $SHA)"
