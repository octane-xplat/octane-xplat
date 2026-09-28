#!/usr/bin/env bash
set -euo pipefail

host_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(git -C "$host_dir" rev-parse --show-toplevel)"
scratch="${XPLAT_JSC_BUILD_DIR:-$repo_root/research/macos-jsc-runtime}"
source_dir="$scratch/sources"
build_dir="$scratch/build"
output_dir="$scratch/output"
install_artifacts=0
if [[ "${1:-}" == "--install" ]]; then install_artifacts=1; elif [[ $# -ne 0 ]]; then
  echo "usage: build-runtime.sh [--install]" >&2
  exit 2
fi

if [[ "$(uname -s)" != Darwin || "$(uname -m)" != arm64 ]]; then
  echo "Build on an Apple Silicon Mac" >&2
  exit 2
fi

mkdir -p "$source_dir" "$build_dir" "$output_dir"

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

clone_at libjsc https://github.com/holepunchto/libjsc.git 8ebb40f77efc8d89a6d3e06de1c73c8ed382c7f2
clone_at libjs https://github.com/holepunchto/libjs.git 7031ca1ec4c937200a03850072df85d3c826efc0
clone_at libnapi https://github.com/holepunchto/libnapi.git b4c5a66e9865f220bcc595be465f3bb566fd9e35
clone_at libutf https://github.com/holepunchto/libutf.git c542254ca22a7b0d3183e5fcc0826662e5e904c3
clone_at libintrusive https://github.com/holepunchto/libintrusive.git 01eae7f87e0f9613de35572f8cf53e9282e409f4
clone_at libuv https://github.com/libuv/libuv.git 5152db2cbfeb5582e9c27c5ea1dba2cd9e10759b
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
apply_patch_once libjsc "$host_dir/patches/libjsc.patch"
apply_patch_once runtimes "$host_dir/patches/nativescript-runtimes.patch"

for name in libjsc libjs libnapi libutf libintrusive; do
  if [[ -f "$source_dir/$name/package.json" ]]; then
    pnpm install --dir "$source_dir/$name" --no-frozen-lockfile
  fi
done
if [[ ! -f "$scratch/package.json" ]]; then
  printf '{"private":true}\n' > "$scratch/package.json"
fi
pnpm add --dir "$scratch" --save-exact bare-compat-napi@1.4.1

cmake -S "$host_dir" -B "$build_dir/host" \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_OSX_ARCHITECTURES=arm64 \
  -DCMAKE_OSX_DEPLOYMENT_TARGET=13.5 -DXPLAT_JSC_SOURCE_DIR="$source_dir" \
  "-DFETCHCONTENT_SOURCE_DIR_GITHUB+HOLEPUNCHTO+LIBJS=$source_dir/libjs" \
  "-DFETCHCONTENT_SOURCE_DIR_GITHUB+HOLEPUNCHTO+LIBUTF=$source_dir/libutf" \
  "-DFETCHCONTENT_SOURCE_DIR_GITHUB+HOLEPUNCHTO+LIBINTRUSIVE=$source_dir/libintrusive" \
  "-DFETCHCONTENT_SOURCE_DIR_GITHUB+LIBUV+LIBUV=$source_dir/libuv"
cmake --build "$build_dir/host" --target xplat-macos-host -j 8

metadata="$host_dir/prebuilt/macos-arm64/metadata.nsmd"
mkdir -p "$source_dir/runtimes/metadata-generator/metadata"
cp "$metadata" "$source_dir/runtimes/metadata-generator/metadata/metadata.macos.arm64.nsmd"
node_executable="$(realpath "$(command -v node)")"
node_include="$(dirname "$(dirname "$node_executable")")/include/node"
brew_include="$(brew --prefix)/include"
compat_include="$scratch/node_modules/bare-compat-napi/include"
cmake -S "$source_dir/runtimes/NativeScript" -B "$build_dir/nativescript" -G Xcode \
  -DCMAKE_OSX_ARCHITECTURES=arm64 -DCMAKE_OSX_DEPLOYMENT_TARGET=13.5 \
  -DTARGET_PLATFORM=macos -DTARGET_ENGINE=none -DNS_FFI_BACKEND=napi \
  -DNS_GSD_BACKEND=none -DMETADATA_SIZE="$(wc -c < "$metadata" | tr -d ' ')" \
  "-DCMAKE_CXX_FLAGS=-DBARE_COMPAT_NAPI -include $compat_include/bare/module.h -I$compat_include -I$node_include -I$brew_include"
cmake --build "$build_dir/nativescript" --config RelWithDebInfo -j 4 -- CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO

cp "$build_dir/host/xplat-macos-host" "$output_dir/host"
if [[ -d "$output_dir/NativeScript.framework" ]]; then rm -r "$output_dir/NativeScript.framework"; fi
cp -R "$build_dir/nativescript/RelWithDebInfo/NativeScript.framework" "$output_dir/NativeScript.framework"
if [[ -d "$output_dir/NativeScript.framework/Versions/A/_CodeSignature" ]]; then
  rm -r "$output_dir/NativeScript.framework/Versions/A/_CodeSignature"
fi
vtool -show-build "$output_dir/host"
vtool -show-build "$output_dir/NativeScript.framework/Versions/A/NativeScript"
echo "Built host and framework in $output_dir"

if [[ "$install_artifacts" == 1 ]]; then
  cp "$output_dir/host" "$host_dir/prebuilt/macos-arm64/host"
  rm -r "$host_dir/prebuilt/macos-arm64/NativeScript.framework"
  cp -R "$output_dir/NativeScript.framework" "$host_dir/prebuilt/macos-arm64/NativeScript.framework"
  python3 - "$host_dir/prebuilt" <<'PY'
import hashlib, json, pathlib, sys
root = pathlib.Path(sys.argv[1])
manifest_path = root / 'manifest.json'
manifest = json.loads(manifest_path.read_text())
manifest['sha256'] = {path: hashlib.sha256((root / path).read_bytes()).hexdigest() for path in manifest['sha256']}
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
PY
  echo "Installed prebuilt artifacts and refreshed checksums"
fi
