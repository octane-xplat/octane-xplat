# Build and stage Linux GTK runtime payloads

Use the SDK, Mason, ICU, and runtime inputs pinned in `runtime-pins.json`. The release workflow stages both architecture archives before packing the GTK renderer.

Prepare a fresh task-owned executable directory on x86_64 or aarch64 Linux. The helper selects the runtime and metadata generator for the host architecture and checks the executable and libraries. Pass `--runtime /path/to/source-built/ns-linux` to pair the source build with the package's SDK metadata. The output path must not exist:

```sh
python3 tools/linux-runtime-release/prepare-metadata.py \
  --package /path/to/extracted/package \
  --header /path/to/mason_native.h \
  --library /path/to/libmason_c.so \
  --output /path/to/task-scratch/prepared
```

The helper copies the executable, SDK metadata, and Mason library. It generates additional metadata for Mason and GTK matrix calls under `metadata/` and records input hashes. The runtime finds extra metadata and `lib/` beside its executable. The generated modules link by library name so the prepared directory can move.

To prepare ARM64 metadata inside the Andromeda x86_64 VM, pass `--arch aarch64 --generator-runner /path/to/arm64-runner` and supply ARM64 runtime and library files. The runner receives the ARM64 generator path and its arguments. It should invoke the generator through QEMU user emulation with the extracted ARM64 library sysroot. The WebKit helper accepts the same runner and a `--sysroot` for Clang. Set `PKG_CONFIG_SYSROOT_DIR` and `PKG_CONFIG_LIBDIR` to select the ARM64 GTK headers for that run.

### Build the pinned executable

On a macOS build host, reserve a native build slot. Use Rust 1.99.1 with the target's Linux standard library, Zig 0.17.1, LLVM 23.1.5, Python 3 and pkg-config. ARM64 also requires LLD 22.1.8 for the final link so Rust's Cortex-A53 workaround is applied. Set `LINUX_RUNTIME_LLVM_BIN` or `LINUX_RUNTIME_ARM64_LLD` when those tools are outside Homebrew's default paths. The optional `LINUX_RUNTIME_RUST_TOOLCHAIN` selects a local rustup name for the same pinned compiler.

Put the [pinned linux-runtime source archive](https://codeload.github.com/triniwiz/linux-runtime/tar.gz/57408ba5e9cfe4a48bc68223c9d53a869d2cee5f) in the input directory as `source.tar.gz`. From the [rusty_v8 147.4.0 release](https://github.com/denoland/rusty_v8/releases/tag/v147.4.0), save `librusty_v8_release_<arch>-unknown-linux-gnu.a.gz` as `v8-147.4.0-<arch>.a.gz`. Supply the frozen target GLib build inputs as `glib-sysroot-<arch>.tar.gz`. This archive contains the target headers, pkg-config files and shared libraries for GLib, GObject and libffi. Use `x86_64` or `aarch64` for `<arch>`.

```sh
sh tools/linux-runtime-release/build-runtime-executable.sh \
  x86_64 /path/to/inputs /path/to/new-build
```

The script verifies all three archives and the Cargo lock before building in a fresh directory. A successful run produces a stripped `ns-linux`, the upstream runtime license, a checksum file and an input manifest. Check `runtime-linkage.txt` for the binary's library and glibc requirements. To check reproducibility, run the script again with the same inputs in a different output directory and compare both checksum files. The SDK metadata, TypeScript declarations, Mason libraries, ICU data and remaining dependency licenses are separate distribution inputs.

### Stage the runtime payload

After preparing the SDK with the source-built executable and generating the WebKitGTK and libsoup metadata, assemble the files for one Linux architecture. Supply the SDK's `framework/typings` directory and a directory with `icu.txt`, `mason.txt`, `v8.txt`, and `rust-dependencies.txt` license notices. Generate the Rust notices from the pinned checkout's Cargo lock:

```sh
python3 tools/linux-runtime-release/collect-runtime-notices.py \
  --arch x86_64 --source /path/to/pinned-linux-runtime-source \
  --supplemental /path/to/libffi-notices --v8 /path/to/notices/v8.txt \
  --output /path/to/notices/rust-dependencies.txt
```

The libffi crates omit their workspace-root license texts. Use
`LICENSE-MIT` and `LICENSE-APACHE` from the commit named by each crate's
`.cargo_vcs_info.json` in the [libffi-rs repository](https://github.com/tov/libffi-rs).
Prefix those files with the crate and version, for example
`libffi-5.2.0-LICENSE-MIT`.

```sh
python3 tools/linux-runtime-release/stage-runtime-bundle.py \
  --arch x86_64 --build /path/to/runtime-build --prepared /path/to/prepared \
  --webkit /path/to/webkit.bin --icu /path/to/icudt77l.dat \
  --schema /path/to/gi.json --typings /path/to/sdk/typings \
  --licenses /path/to/licenses --output /path/to/new-payload
```

The payload includes the executable, its metadata and libraries, the GI schema, ICU data, notices, and TypeScript declarations. `manifest.json` records the architecture and SHA-256 of each file. Pass the staged `icu/` directory as `ICU_DATA` when running the executable directly. Pass `--archive /path/to/<arch>.tar.gz` to also write a release archive with stable entry order, ownership, permissions, and timestamps.

### Stage the runtime pair for the renderer package

The GTK renderer package is the distribution boundary for the runtime files.
Stage the two architecture payloads before packing that package:

```sh
python3 tools/linux-runtime-release/stage-runtime-release.py \
  --output packages/linux-gtk-renderer/platforms/linux/runtime
```

The command reads the architecture archives in
`packages/linux-gtk-renderer/prebuilt-runtime/`. It checks both manifest
hashes against `runtime-pins.json`, verifies the files, and requires a shared
GI schema. Stable and nightly publication run this step before packing the
renderer. The renderer tarball contains the extracted payloads under
`platforms/linux/runtime`.

When the selected app has that renderer tarball installed, run
`xplat build --targets linux` in the app with its usual `linuxGtk` Vite config.
The CLI discovers the installed payload pair and produces a Linux archive with
both executables. Its launcher selects the payload for the machine it runs on.

### Prepare WebKitGTK metadata

WebView needs WebKitGTK 6.0 and JavaScriptCore metadata. HTTP images need libsoup 3 metadata. Use headers matching the installed libraries, the GTK4 development headers, and the Linux metadata generator. Run this on the target Linux architecture after preparing the runtime directory. The output paths must be new:

```sh
python3 tools/linux-runtime-release/prepare-webkit-metadata.py \
  --generator /path/to/metadata-generator \
  --webkit-include /path/to/include/webkitgtk-6.0 \
  --soup-include /path/to/include/libsoup-3.0 \
  --output /path/to/prepared/metadata/webkit.bin \
  --manifest /path/to/prepared/webkit-manifest.json
```

The generator records its own hash, header-tree hashes, GTK version and metadata hash. It uses the target system's GTK headers; these records alone do not establish a reproducible runtime build. Re-export the GI schema on the same host with WebKitGTK 6.0 and JavaScriptCore typelibs installed, then pass its local path with `LINUX_RUNTIME_EVAL_GI_SCHEMA` when running the [GTK integration suite](../linux-gtk-tests/README.md). Set `LINUX_RUNTIME_EVAL_EXECUTABLE` and `LINUX_RUNTIME_EVAL_MASON_DIR` to the prepared directory's executable and Mason files as in the suite commands above.

Export the schema on the same Linux host using its typelibs:

```sh
gjs tools/linux-runtime-release/export-gi.js /path/to/gi.json
```
