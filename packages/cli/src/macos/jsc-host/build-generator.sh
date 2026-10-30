#!/usr/bin/env bash
# Framework-maintainer tool. App builds use the shipped generator, not this script.
set -euo pipefail
host_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(git -C "$host_dir" rev-parse --show-toplevel)"
scratch="${XPLAT_METADATA_BUILD_DIR:-$repo_root/research/macos-native-tooling}"
source_dir="$scratch/source"
build_dir="$scratch/build"
if [[ $# -gt 1 || ( $# -eq 1 && "$1" != --install ) ]]; then
  echo 'usage: build-generator.sh [--install]' >&2
  exit 2
fi
if [[ "$(uname -s)" != Darwin || ( "$(uname -m)" != arm64 && "$(uname -m)" != x86_64 ) ]]; then
  echo 'Build on a macOS arm64 or x86_64 Mac with Xcode, Command Line Tools, and CMake' >&2
  exit 2
fi
# The generator links the Command Line Tools libclang, so a slice builds only
# where that libclang carries the target arch. XPLAT_GENERATOR_ARCH overrides
# the default host-arch build (e.g. an x86_64 slice on Apple Silicon with a
# universal libclang).
generator_arch="${XPLAT_GENERATOR_ARCH:-$(uname -m)}"
revision=5b697b393152f973dd392851fd72dacf03a7a0c9
mkdir -p "$scratch"
if [[ ! -d "$source_dir" ]]; then
  git clone --filter=blob:none --no-checkout https://github.com/NativeScript/runtimes.git "$source_dir"
  git -C "$source_dir" checkout --detach "$revision"
fi
if [[ "$(git -C "$source_dir" rev-parse HEAD)" != "$revision" ]]; then
  echo 'Source revision differs; choose a fresh XPLAT_METADATA_BUILD_DIR' >&2
  exit 1
fi
for name in nativescript-runtimes metadata-leaves; do
  patch="$host_dir/patches/$name.patch"
  if git -C "$source_dir" apply --check "$patch"; then
    git -C "$source_dir" apply "$patch"
  elif ! git -C "$source_dir" apply --reverse --check "$patch"; then
    echo "Cannot apply $patch; choose a fresh XPLAT_METADATA_BUILD_DIR" >&2
    exit 1
  fi
done
cmake -S "$source_dir/metadata-generator" -B "$build_dir/$generator_arch" \
  -DCMAKE_BUILD_TYPE=Release -DMETADATA_BINARY_ARCH="$generator_arch" \
  -DCMAKE_OSX_ARCHITECTURES="$generator_arch" -DCMAKE_OSX_DEPLOYMENT_TARGET=13.5 \
  -DCMAKE_OBJC_COMPILER="$(xcrun --find clang)" \
  -DCMAKE_CXX_COMPILER="$(xcrun --find clang++)" \
  -DCMAKE_OSX_SYSROOT="$(xcrun --sdk macosx --show-sdk-path)"
cmake --build "$build_dir/$generator_arch" -j 8
"$build_dir/$generator_arch/bin/objc-metadata-generator" --xplat-check
if [[ "${1:-}" == --install ]]; then
  # Merge the fresh slice into the shipped binary so the prebuilt generator
  # runs on both build-host architectures.
  generator="$host_dir/prebuilt/macos/objc-metadata-generator"
  built="$build_dir/$generator_arch/bin/objc-metadata-generator"
  if [[ -f "$generator" ]]; then
    if lipo "$generator" -verify_arch "$generator_arch" 2>/dev/null; then
      lipo "$generator" -replace "$generator_arch" "$built" -output "$generator.next"
    else
      lipo -create "$generator" "$built" -output "$generator.next"
    fi
    mv "$generator.next" "$generator"
  else
    cp "$built" "$generator"
  fi
  cp "$source_dir/packages/objc-node-api/LICENSE" "$host_dir/prebuilt/licenses/metadata-generator.txt"
  python3 - "$host_dir/prebuilt" <<'PY'
import hashlib, json, pathlib, sys
root = pathlib.Path(sys.argv[1])
path = root / 'manifest.json'
manifest = json.loads(path.read_text())
generator = 'macos/objc-metadata-generator'
manifest['metadataGenerator'] = {
    'path': generator,
    'sourceRevision': manifest['sourceRevisions']['nativescriptRuntimes'],
    'patches': ['patches/nativescript-runtimes.patch', 'patches/metadata-leaves.patch'],
    'libclang': 'Command Line Tools libclang (checked by --xplat-check)',
}
manifest['sha256'][generator] = hashlib.sha256((root / generator).read_bytes()).hexdigest()
path.write_text(json.dumps(manifest, indent=2) + '\n')
PY
fi
