#!/usr/bin/env bash
# Regenerate metadata.nsmd for the AppKit/JSC host.
#
# The nsmd is built by NativeScript's objc-metadata-generator — a clang/libclang
# AST walk over an umbrella header that imports every SDK module. Our
# nativescript-runtimes.patch extends the generated umbrella with
# `#import <sqlite3.h>` and `#import <dlfcn.h>` (both live in usr/include module
# maps, so the framework-only sweep skips them) and registers the SDK's
# usr/include dir with the generator's includePaths filter. That puts the
# sqlite3_* C API and dlopen/dlsym into the metadata, which the runtime then
# resolves like any other declared C function — this is what lets
# @octane-xplat/sqlite bind real system libsqlite3 on macOS.
#
# Prerequisites: /Library/Developer/CommandLineTools (system libclang for the
# generator's link step) and a macOS SDK. Run with --install to copy the result
# into prebuilt/ and refresh manifest checksums.
set -euo pipefail

host_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(git -C "$host_dir" rev-parse --show-toplevel)"
scratch="${XPLAT_JSC_BUILD_DIR:-$repo_root/research/macos-jsc-runtime}"
source_dir="$scratch/sources"
build_dir="$scratch/build"
install_artifacts=0
if [[ "${1:-}" == "--install" ]]; then install_artifacts=1; elif [[ $# -ne 0 ]]; then
  echo "usage: build-metadata.sh [--install]" >&2
  exit 2
fi

if [[ "$(uname -s)" != Darwin || "$(uname -m)" != arm64 ]]; then
  echo "Build on an Apple Silicon Mac" >&2
  exit 2
fi

mkdir -p "$source_dir" "$build_dir"

clone_at() {
  local name="$1" url="$2" revision="$3"
  if [[ ! -d "$source_dir/$name/.git" ]]; then
    git clone --quiet --depth 1 --filter=blob:none "$url" "$source_dir/$name"
  fi
  if [[ "$(git -C "$source_dir/$name" rev-parse HEAD)" != "$revision" ]]; then
    if [[ -n "$(git -C "$source_dir/$name" status --porcelain)" ]]; then
      echo "$name has local changes; use a clean XPLAT_JSC_BUILD_DIR" >&2
      exit 1
    fi
    git -C "$source_dir/$name" fetch --quiet --depth 1 origin "$revision"
    git -C "$source_dir/$name" checkout --quiet --detach "$revision"
  fi
}

# Same pin as build-runtime.sh — keep the two in sync.
clone_at runtimes https://github.com/NativeScript/runtimes.git 5b697b393152f973dd392851fd72dacf03a7a0c9

apply_patch_once() {
  local name="$1" patch="$2"
  if git -C "$source_dir/$name" apply --check "$patch"; then
    git -C "$source_dir/$name" apply "$patch"
  elif ! git -C "$source_dir/$name" apply --reverse --check "$patch"; then
    echo "Cannot apply $patch to pinned $name" >&2
    exit 1
  fi
}
apply_patch_once runtimes "$host_dir/patches/nativescript-runtimes.patch"

# The generator links the Command Line Tools' libclang; the CLT linker cannot
# parse recent SDK .tbd files, so point the toolchain at Xcode's clang/ld while
# keeping the explicit libclang path.
export DEVELOPER_DIR="${DEVELOPER_DIR:-$(xcode-select -p)}"
sdk_path="$(xcrun --sdk macosx --show-sdk-path)"

gen_dir="$source_dir/runtimes/metadata-generator"
cmake -S "$gen_dir" -B "$gen_dir/build" \
  -DCMAKE_BUILD_TYPE=Release -DMETADATA_BINARY_ARCH=arm64 \
  -DCMAKE_OSX_ARCHITECTURES=arm64 -DCMAKE_OSX_SYSROOT="$sdk_path"
cmake --build "$gen_dir/build" -j 8

out_dir="$build_dir/metadata"
types_dir="$build_dir/metadata-types"
json_dir="$build_dir/metadata-json"
mkdir -p "$out_dir" "$types_dir" "$json_dir"

# Mirrors scripts/metagen.js's macos invocation (same arg set, arm64 only).
"$gen_dir/build/bin/objc-metadata-generator" \
  "types=$types_dir" "json=$json_dir" \
  ts-index-mode=frameworks-list ts-index-frameworks=Foundation,AppKit \
  -output-bin "$out_dir/metadata.macos.arm64.nsmd" \
  -output-umbrella "$out_dir/umbrella.macos.arm64.h" \
  -output-signature-bindings-cpp "$out_dir/GeneratedSignatureDispatch.inc" \
  Xclang -isysroot "$sdk_path" -std=gnu99 -target arm64-apple-macos11.0

echo "Generated $out_dir/metadata.macos.arm64.nsmd"

if [[ "$install_artifacts" == 1 ]]; then
  cp "$out_dir/metadata.macos.arm64.nsmd" "$host_dir/prebuilt/macos-arm64/metadata.nsmd"
  python3 - "$host_dir/prebuilt" <<'PY'
import hashlib, json, pathlib, sys
root = pathlib.Path(sys.argv[1])
manifest_path = root / 'manifest.json'
manifest = json.loads(manifest_path.read_text())
manifest['sha256'] = {path: hashlib.sha256((root / path).read_bytes()).hexdigest() for path in manifest['sha256']}
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
PY
  echo "Installed metadata.nsmd and refreshed checksums"
fi
