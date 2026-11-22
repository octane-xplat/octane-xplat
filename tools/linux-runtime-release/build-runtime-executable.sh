#!/bin/sh
# Cross-build the pinned NativeScript Linux executable from a macOS build host.
set -eu

if [ "$#" -ne 3 ]; then
  echo 'Usage: sh build-runtime-executable.sh <x86_64|aarch64> <input-directory> <new-output-directory>' >&2
  exit 2
fi

arch=$1
case "$arch" in
  x86_64)
    v8_hash=09ddef6c51192afff0541131a0ef9c00f83185d2391daab180382a3abf36ac95
    sysroot_hash=c67edda30eb1f94a7bcb1b13e330b6f06a7178da9d7202198ba337fd147da6c8
    rust_lib_hash=ef9962591ef8456ff4d97f52bc348d62fd01f07249ff19101ebe7a9477929ad0
    machine='Advanced Micro Devices X86-64'
    ;;
  aarch64)
    v8_hash=94c3f0fde0051404fca1b691f28a496d78db830e7cfb499a044cb1a5e3a59455
    sysroot_hash=7d905d5f2fcb61a522513c6c402b6d960c23fbd0bcbda239369170496246065e
    rust_lib_hash=17eea9828a06f2530c6932f5e2267bfd5080794f940e1097346fb747a3fea4d3
    machine=AArch64
    ;;
  *)
    echo "Unsupported architecture: $arch" >&2
    exit 2
    ;;
esac

source_commit=158da846adc6d123817ff9a172b26bb8a183e12f
source_hash=e82340ad584a4d9cc6831c4f91ad29dd1a3532df472b2c28b6de6a4b144f79e2
lock_hash=b2e8e6e1d1925b09eb28a97837b5e0b79626e3c32868f51114f5b2485d998167
target="$arch-unknown-linux-gnu"
toolchain=${LINUX_RUNTIME_RUST_TOOLCHAIN:-1.99.1}
llvm_bin=${LINUX_RUNTIME_LLVM_BIN:-/opt/homebrew/opt/llvm/bin}
lld=${LINUX_RUNTIME_ARM64_LLD:-/opt/homebrew/opt/lld@22/bin/ld.lld}
rust_version=$(rustc "+$toolchain" -Vv)
zig_version=$(zig version)
strip_version=$("$llvm_bin/llvm-strip" --version)
case "$rust_version" in
  *58cf8f9c35b355199727627d07ae34a4e2846d67*) ;;
  *) echo 'This build requires Rust 1.99.1 (58cf8f9c3)' >&2; exit 2 ;;
esac
case "$strip_version" in
  *23.1.6*) ;;
  *) echo 'This build requires llvm-strip 23.1.6' >&2; exit 2 ;;
esac
if [ "$zig_version" != 0.17.1 ]; then
  echo 'This build requires Zig 0.17.1' >&2
  exit 2
fi
if [ "$arch" = aarch64 ]; then
  lld_version=$("$lld" --version)
  case "$lld_version" in
    *22.1.8*) ;;
    *) echo 'The ARM64 final link requires LLD 22.1.8' >&2; exit 2 ;;
  esac
fi

rust_lib=$(rustc "+$toolchain" --print target-libdir --target "$target")
python3 - "$rust_lib" "$rust_lib_hash" <<'PY'
import hashlib
from pathlib import Path
import sys

root = Path(sys.argv[1])
if not root.is_dir():
    sys.exit(f"Install the Rust target library at {root}")
digest = hashlib.sha256()
for file in sorted(root.iterdir()):
    if file.is_file():
        digest.update(file.name.encode() + b"\0" + hashlib.sha256(file.read_bytes()).digest())
if digest.hexdigest() != sys.argv[2]:
    sys.exit(f"Unexpected Rust target library hash: {digest.hexdigest()}")
PY

input=$(cd "$2" && pwd -P)
v8_archive="$input/v8-147.4.0-$arch.a.gz"
sysroot_archive="$input/glib-sysroot-$arch.tar.gz"
printf '%s  %s\n' "$source_hash" "$input/source.tar.gz" "$v8_hash" "$v8_archive" \
  "$sysroot_hash" "$sysroot_archive" | shasum -a 256 -c -

mkdir -- "$3"
output=$(cd "$3" && pwd -P)
work=$(mktemp -d "$output/work-XXXXXXXX")
trap 'rm -rf "$work"' EXIT
mkdir "$work/src" "$work/sysroot"
tar -xzf "$input/source.tar.gz" --strip-components=1 -C "$work/src"
tar -xzf "$sysroot_archive" -C "$work/sysroot"
lib_dir="$work/sysroot/usr/lib/$arch-linux-gnu"

# cc-rs adds a Clang target triple. Zig uses its own spelling and needs
# the glibc baseline on that target, so drop only the redundant argument.
cat > "$work/cc" <<'PY'
#!/usr/bin/env python3
import os
from pathlib import Path
import shlex
import subprocess
import sys

mode = "c++" if Path(sys.argv[0]).name == "cxx" else "cc"
arch = os.environ["XPLAT_LINUX_ARCH"]
redundant_target = f"--target={arch}-unknown-linux-gnu"
args = [arg for arg in sys.argv[1:] if arg != redundant_target]
zig = ["zig", mode, "-target", f"{arch}-linux-gnu.2.28"]
erratum = "-Wl,--fix-cortex-a53-843419"
if erratum not in args:
    os.execvp("zig", zig + args)

# Zig's Clang driver rejects this flag. Let it resolve the target libc
# and runtime objects, then replay the final link with LLD and the flag.
args.remove(erratum)
link = subprocess.run(zig + ["-v"] + args, stderr=subprocess.PIPE, text=True)
if link.returncode != 0:
    sys.stderr.write(link.stderr)
    sys.exit(link.returncode)
commands = [line for line in link.stderr.splitlines() if line.startswith("ld.lld ")]
if not commands:
    sys.exit("Zig did not report its final linker invocation")
lld = os.environ["XPLAT_ARM64_LLD"]
os.execv(lld, [lld, erratum.removeprefix("-Wl,"), *shlex.split(commands[-1])[1:]])
PY
cp "$work/cc" "$work/cxx"
cat > "$work/ar" <<'AR'
#!/bin/sh
exec zig ar "$@"
AR
chmod +x "$work/cc" "$work/cxx" "$work/ar"

target_env=$(printf '%s' "$target" | tr '-' '_')
cargo_target_env=$(printf '%s' "$target_env" | tr '[:lower:]' '[:upper:]')
export "CC_$target_env=$work/cc" "CXX_$target_env=$work/cxx" "AR_$target_env=$work/ar"
export "CARGO_TARGET_${cargo_target_env}_LINKER=$work/cc"
export "PKG_CONFIG_SYSROOT_DIR_$target_env=$work/sysroot"
export "PKG_CONFIG_LIBDIR_$target_env=$lib_dir/pkgconfig"
export XPLAT_LINUX_ARCH="$arch" CARGO_HOME="$work/cargo" ZIG_GLOBAL_CACHE_DIR="$work/zig-cache"
export XPLAT_ARM64_LLD="$lld"
export RUSTY_V8_ARCHIVE="$v8_archive" SOURCE_DATE_EPOCH=1795266021

# Link the target system libffi explicitly. The cross-build's vendored
# libffi lacks the required symbols, and system GObject already uses this ABI.
export CARGO_ENCODED_RUSTFLAGS="$(printf '%s\037%s\037%s\037%s' \
  "--remap-path-prefix=$work/src=." "--remap-path-prefix=$work/cargo=/cargo" \
  '-Clink-arg=-Wl,--build-id=none' "-Clink-arg=$lib_dir/libffi.so.8")"
cd "$work/src"
printf '%s  Cargo.lock\n' "$lock_hash" | shasum -a 256 -c -
cargo_version=$(cargo "+$toolchain" --version)
cargo "+$toolchain" build --jobs 3 --release --locked --target "$target" -p nativescript-cli --bin ns-linux

binary="target/$target/release/ns-linux"
# Static ARM64 symbol names can include paths from the build directory.
# Strip that table while keeping the dynamic symbols used by native interop.
"$llvm_bin/llvm-strip" --strip-debug "$binary"
"$llvm_bin/llvm-strip" --strip-all "$binary"
"$llvm_bin/llvm-readelf" --file-header --dynamic --version-info "$binary" > "$work/runtime-linkage.txt"
grep -Eq "Machine:[[:space:]]+$machine$" "$work/runtime-linkage.txt"
install -m 755 "$binary" "$output/ns-linux"
install -m 644 LICENSE "$output/LICENSE.linux-runtime"
install -m 644 "$work/runtime-linkage.txt" "$output/runtime-linkage.txt"
cd "$output"
shasum -a 256 ns-linux LICENSE.linux-runtime > SHA256SUMS
printf '%s\n' \
  "architecture=$arch" "source_commit=$source_commit" "source_sha256=$source_hash" \
  "cargo_lock_sha256=$lock_hash" "v8_archive_sha256=$v8_hash" "sysroot_sha256=$sysroot_hash" \
  "rust_target_library_sha256=$rust_lib_hash" \
  "rust_toolchain=$toolchain" "$rust_version" "$cargo_version" "zig=$zig_version" \
  "$strip_version" "arm64_linker=${lld_version:-unused}" "source_date_epoch=$SOURCE_DATE_EPOCH" > build-inputs.txt
cat SHA256SUMS
