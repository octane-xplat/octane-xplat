# Evaluate the NativeScript Linux runtime

This private probe compares Octane's GTK renderer and shared UI on NativeScript's Linux V8 runtime and GJS. It does not change the shipping GTK renderer. It is an evaluation harness, not production qualification or a runtime installer.

The NativeScript adapter uses GTK C functions, a JavaScript-defined `GtkLayoutManager`, and the real Mason C engine. The GJS control uses `Gtk.Box`; its input and lifecycle checks are comparable, but it does not compare Mason implementations. The adapter deliberately covers only the four widgets in this screen.

## Build

From the repository root, with Bun 1.4.4 and workspace dependencies installed:

```sh
bun run turbo run build typecheck --filter=...@xplat/linux-runtime-eval
```

The generated `dist/native/slice.js` and `dist/gjs/slice.js` are disposable. The checked-in screen tests a counter, uppercase-controlled text, stable widget identity, 100 microtask updates, 20 mount/unmount cycles, cancellation of a queued event, and a five-second drain. Native checks also observe Mason geometry, leaf measurement callbacks, and GObject finalization.

## Prepare an exploratory NativeScript runtime

Use the existing `octane-linux` VM on `andromeda.local` for Linux testing. The fixtures require GTK4, GJS, Python 3, D-Bus, Xvfb, X11, and XTest libraries. No screenshots are captured. Reserve the VM before running native tools. Remote mode requires this checkout to be mounted at the same absolute path inside the VM.

The manual steps below support exploratory runs only. They do not produce a pinned, reproducible, multi-architecture runtime distribution. The existing binaries in task scratch have incomplete build provenance and must not be treated as official artifacts. Building and packaging a verified runtime for each supported architecture remains a release gate.

Obtain the runtime package, verify its npm integrity, and extract it into disposable task storage. Build `libmason_c.so` for the target architecture from the matching Mason source. This tool consumes that artifact rather than managing Rust toolchains. Use Mason's public `mason_native.h`; keep the source revisions, locks, and input hashes with the run evidence.

Prepare a fresh task-owned executable directory on x86_64 or aarch64 Linux. The helper selects the runtime and metadata generator for the host architecture and checks the executable and libraries. Pass `--runtime /path/to/source-built/ns-linux` to pair the source build with the package's SDK metadata. The output path must not exist:

```sh
python3 tools/linux-runtime-eval/prepare-metadata.py \
  --package /path/to/extracted/package \
  --header /path/to/mason_native.h \
  --library /path/to/libmason_c.so \
  --output /path/to/task-scratch/prepared
```

The helper copies the executable, SDK metadata, and Mason library; generates additional metadata under `metadata/`; and records input hashes. The runtime finds extra metadata and `lib/` beside its executable. The generated module uses a library name rather than an absolute library path, so the prepared directory can move. This is a probe bundle, not an installer or complete application package.

To prepare ARM64 metadata inside the Andromeda x86_64 VM, pass `--arch aarch64 --generator-runner /path/to/arm64-runner` and supply ARM64 runtime and library files. The runner receives the ARM64 generator path and its arguments. It should invoke the generator through QEMU user emulation with the extracted ARM64 library sysroot. The WebKit helper accepts the same runner and a `--sysroot` for Clang. Set `PKG_CONFIG_SYSROOT_DIR` and `PKG_CONFIG_LIBDIR` to select the ARM64 GTK headers for that run.

### Build the pinned executable

On a macOS build host, reserve a native build slot. Use Rust 1.99.1 with the target's Linux standard library, Zig 0.17.1, LLVM 23.1.5, Python 3 and pkg-config. ARM64 also requires LLD 22.1.8 for the final link so Rust's Cortex-A53 workaround is applied. Set `LINUX_RUNTIME_LLVM_BIN` or `LINUX_RUNTIME_ARM64_LLD` when those tools are outside Homebrew's default paths. The optional `LINUX_RUNTIME_RUST_TOOLCHAIN` selects a local rustup name for the same pinned compiler.

Put the [pinned linux-runtime source archive](https://codeload.github.com/triniwiz/linux-runtime/tar.gz/57408ba5e9cfe4a48bc68223c9d53a869d2cee5f) in the input directory as `source.tar.gz`. From the [rusty_v8 147.4.0 release](https://github.com/denoland/rusty_v8/releases/tag/v147.4.0), save `librusty_v8_release_<arch>-unknown-linux-gnu.a.gz` as `v8-147.4.0-<arch>.a.gz`. Supply the frozen target GLib build inputs as `glib-sysroot-<arch>.tar.gz`. This archive contains the target headers, pkg-config files and shared libraries for GLib, GObject and libffi. Use `x86_64` or `aarch64` for `<arch>`.

```sh
sh tools/linux-runtime-eval/build-runtime-executable.sh \
  x86_64 /path/to/inputs /path/to/new-build
```

The script verifies all three archives and the Cargo lock before building in a fresh directory. A successful run produces a stripped `ns-linux`, the upstream runtime license, a checksum file and an input manifest. Check `runtime-linkage.txt` for the binary's library and glibc requirements. To check reproducibility, run the script again with the same inputs in a different output directory and compare both checksum files. The SDK metadata, TypeScript declarations, Mason libraries, ICU data and remaining dependency licenses are separate distribution inputs.

### Stage the runtime payload

After preparing the SDK with the source-built executable and generating the WebKit metadata, assemble the files for one Linux architecture. Supply the SDK's `framework/typings` directory and a directory with `icu.txt`, `mason.txt`, and `v8.txt` license notices.

```sh
python3 tools/linux-runtime-eval/stage-runtime-bundle.py \
  --arch x86_64 --build /path/to/runtime-build --prepared /path/to/prepared \
  --webkit /path/to/webkit.bin --icu /path/to/icudt77l.dat \
  --schema /path/to/gi.json --typings /path/to/sdk/typings \
  --licenses /path/to/licenses --output /path/to/new-payload
```

The payload includes the executable, its metadata and libraries, the GI schema, ICU data, notices, and TypeScript declarations. `manifest.json` records the architecture and SHA-256 of each file. It is written last. A payload without it is incomplete. Pass the staged `icu/` directory as `ICU_DATA` when launching the staged executable.

### Launch an archived app

From the repository root, typecheck the consumer with the staged SDK and build its app archive:

```sh
bun run turbo run typecheck:sdk --filter=@xplat/linux-runtime-eval -- \
  /path/to/payload/typings/index.d.ts
bun run turbo run build:installed-app --filter=@xplat/linux-runtime-eval -- \
  /path/to/payload /path/to/new-app
```

Extract `new-app.tar.gz` in task scratch on Andromeda's Linux VM under a VM reservation. Launch the extracted app from outside that directory:

```sh
cd /tmp
dbus-run-session -- xvfb-run -a /path/to/extracted/new-app/launch
```

The probe reports `{"installedGtkApp":true,"gtkMajor":4}` after the window maps and its rendered label matches. It uses the repository renderer and the executable and ICU data embedded in the archive. This exercises the runtime payload in a relocated app. The build still uses the evaluation preset, before the CLI packaging switch.

## Run with OS input

Run from the repository root under an owned Linux host reservation. For `andromeda.local`'s existing `octane-linux` VM, reserve `exclusive:["linux:andromeda-octane-linux"]` and `resident_devices:1`; preparation also needs `native_builds:1`. Leave the user-owned VM running after releasing the reservation.

```sh
LINUX_RUNTIME_EVAL_HOST=andromeda.local LINUX_RUNTIME_EVAL_VM=octane-linux \
LINUX_RUNTIME_EVAL_EXECUTABLE=/path/to/task-scratch/prepared/ns-linux \
  bun run turbo run test:runtime --filter=@xplat/linux-runtime-eval

LINUX_RUNTIME_EVAL_HOST=andromeda.local LINUX_RUNTIME_EVAL_VM=octane-linux LINUX_RUNTIME_EVAL_ENGINE=gjs \
  bun run turbo run test:runtime --filter=@xplat/linux-runtime-eval
```

Omit `LINUX_RUNTIME_EVAL_VM` when running directly on Linux. The runner creates an isolated Xvfb display and session bus, waits for widget geometry, then sends an XTest click and the keys `abc`. It requires successful assertions, a completion record, a zero process exit, and no GTK/GJS critical diagnostics. A timeout or missing completion fails the run. Its processes and display stop at the end.

The native engine always receives `NS_V8_FLAGS=--expose-gc`: runtime wrappers hold the only GObject reference, so the drain checks must be able to force V8 collections rather than just waiting.

For `test:runtime`, set `LINUX_RUNTIME_EVAL_HOST` to the SSH host and `LINUX_RUNTIME_EVAL_VM` to its OrbStack VM. The runner stages its driver and the entry bundle into a VM-local `/tmp/xplat-lre-*` directory and removes it afterwards. The default host for `test:renderer-fixture` is `andromeda.local` with VM `octane-linux`:

```sh
LINUX_RUNTIME_EVAL_HOST=andromeda.local \
LINUX_RUNTIME_EVAL_VM=octane-linux \
LINUX_RUNTIME_EVAL_EXECUTABLE=/Users/alec/agent-scratch/.../ns-linux \
  bun run turbo run test:runtime --filter=@xplat/linux-runtime-eval
```

## Run real renderer fixtures

The exploratory V8 executable requires ICU data matching its rusty_v8 build. With rusty_v8 147, an absent ICU 77 dataset makes even `new Intl.DateTimeFormat('en-US')` abort with `DateTimePatternGeneratorCache::CreateGenerator`; increasing the JavaScript heap does not supply the missing locale data. The matching [Chromium ICU dataset](https://chromium.googlesource.com/chromium/deps/icu/+/ee5f27adc28bd3f15b2c293f726d14d2e336cbd5/common/icudtl.dat) has SHA-256 `1cf67874b5a87a8363a86fb3f81e3cbbed54d389062dab8fb52308d5cf8c8612`. Store it on the Linux host as `icudt77l.dat` and set `LINUX_RUNTIME_EVAL_ICU_DATA` to its directory for NativeScript renderer runs. Keep its source revision, hash, and license with the eventual runtime package. A newer runtime may require a different ICU version.

Run the maintained Intl smoke on Linux before testing UI components. It checks English and French formatting, a time-zone date boundary, and word/grapheme segmentation. Missing ICU data also makes V8's `Intl.Segmenter.segment()` crash with SIGSEGV, which prevents typeahead text processing:

```sh
ICU_DATA=/path/on/linux/icu77 /path/on/linux/ns-linux tools/linux-runtime-eval/intl-smoke.mjs
```

For the remote renderer commands below, pass `LINUX_RUNTIME_EVAL_ICU_DATA=/path/on/linux/icu77` alongside the executable and Mason variables. This variable configures only NativeScript; the GJS control uses its own installed ICU data.

`test:renderer-fixture` bundles existing GTK renderer fixtures and drives their windows with `xdotool` on Linux. Its UI fixtures are `ui-popover`, `ui-sheet`, `ui-focus`, and `ui-theme`. Run NativeScript and GJS against the same host and fixture to separate projection regressions from the existing GTK baseline:

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["linux:andromeda-octane-linux"],"resident_devices":1},"purpose":"NativeScript GTK renderer fixture","wait_seconds":1}' -- \
  env LINUX_RUNTIME_EVAL_EXECUTABLE=/path/on/linux/ns-linux \
    LINUX_RUNTIME_EVAL_MASON_DIR=/path/on/linux/mason \
    LINUX_RUNTIME_EVAL_LOG_PATH=/path/to/ns-linux-ui-theme.log \
    bun run turbo run test:renderer-fixture --filter=@xplat/linux-runtime-eval -- ui-theme native

goddard-agent resource run --json '{"resources":{"exclusive":["linux:andromeda-octane-linux"],"resident_devices":1},"purpose":"GJS GTK renderer control","wait_seconds":1}' -- \
  env LINUX_RUNTIME_EVAL_MASON_DIR=/path/on/linux/mason \
    LINUX_RUNTIME_EVAL_LOG_PATH=/path/to/gjs-ui-theme.log \
    bun run turbo run test:renderer-fixture --filter=@xplat/linux-runtime-eval -- ui-theme gjs
```

Replace `ui-theme` with a supported fixture name. `LINUX_RUNTIME_EVAL_HOST` and `LINUX_RUNTIME_EVAL_VM` default to `andromeda.local` and `octane-linux`; executable and Mason paths are on the Linux VM. `LINUX_RUNTIME_EVAL_LOG_PATH` stores stdout and stderr locally, including on failure. UI fixtures require real OS input, a completion summary, and the fixture's minimum check count. An assertion failure is kept in the log and returns a non-zero exit.

Run all 37 maintained real GTK fixtures in series with either runtime. The 35 renderer fixtures build the same bundle and stage it on the VM; fixtures that declare input send actual keyboard or pointer events. Two accessibility fixtures also compare GTK's accessible states and labels. The runner writes one local log per fixture in a unique engine-specific directory under `LINUX_RUNTIME_EVAL_LOG_DIR`. Run both engines against the same VM to compare NativeScript failures with the GJS baseline:

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["linux:andromeda-octane-linux"],"resident_devices":1},"purpose":"NativeScript GTK renderer suite","wait_seconds":1}' -- \
  env LINUX_RUNTIME_EVAL_ENGINE=native \
    LINUX_RUNTIME_EVAL_EXECUTABLE=/path/on/linux/ns-linux \
    LINUX_RUNTIME_EVAL_MASON_DIR=/path/on/linux/mason \
    LINUX_RUNTIME_EVAL_LOG_DIR=/path/to/task-scratch/renderer-suite-logs \
    bun run turbo run test:renderer-suite --filter=@xplat/linux-runtime-eval

goddard-agent resource run --json '{"resources":{"exclusive":["linux:andromeda-octane-linux"],"resident_devices":1},"purpose":"GJS GTK renderer suite control","wait_seconds":1}' -- \
  env LINUX_RUNTIME_EVAL_ENGINE=gjs \
    LINUX_RUNTIME_EVAL_MASON_DIR=/path/on/linux/mason \
    LINUX_RUNTIME_EVAL_LOG_DIR=/path/to/task-scratch/renderer-suite-logs \
    bun run turbo run test:renderer-suite --filter=@xplat/linux-runtime-eval
```

Pass fixture stems after `--` for a smaller run, for example `-- ui-theme` or `-- a11y ui-accessibility`; omit them to run all 37.

This command discovers only top-level `test/*.test.mjs` files that call `runGtkUiFixture` or `runGtkEvalFixture`; fixture source files under `test/fixtures/` are not counted separately. Missing typelibs or test failures remain failures in that engine's log; compare matching `*.native.log` and `*.gjs.log` files before classifying them as projection regressions. The WebView fixture needs WebKitGTK 6.0 and JavaScriptCore metadata in the prepared NativeScript runtime; generate that metadata and the matching GI schema as described below.

### Prepare WebKitGTK metadata

For the WebView fixture, use WebKitGTK 6.0 and JavaScriptCore headers matching the installed libraries, the libsoup 3 headers, GTK4 development headers, and the Linux metadata generator. Run this on the target Linux architecture after preparing the runtime directory. The output paths must be new:

```sh
python3 tools/linux-runtime-eval/prepare-webkit-metadata.py \
  --generator /path/to/metadata-generator \
  --webkit-include /path/to/include/webkitgtk-6.0 \
  --soup-include /path/to/include/libsoup-3.0 \
  --output /path/to/prepared/metadata/webkit.bin \
  --manifest /path/to/prepared/webkit-manifest.json
```

The generator records its own hash, header-tree hashes, GTK version and metadata hash. It uses the target system's GTK headers; these records alone do not establish a reproducible runtime build. Re-export the GI schema on the same host with WebKitGTK 6.0 and JavaScriptCore typelibs installed, then pass its local path with `LINUX_RUNTIME_EVAL_GI_SCHEMA` when running the NativeScript fixture. Set `LINUX_RUNTIME_EVAL_EXECUTABLE` and `LINUX_RUNTIME_EVAL_MASON_DIR` to the prepared directory's executable and Mason files as in the suite commands above.

The `ui-webview` fixture tests document loading and the imperative handle without OS input. Its pass does not establish visual parity or other architectures.

### Check projection values and ownership

The `projection` fixture checks decoded bytes, copied buffers, empty arrays, GTK interface membership, property precedence, GLib errors, and transform construction and reuse before broader UI runs. Use the same prepared runtime, Mason directory, and ICU data as above. It performs no OS input and prints a `GTK_PROJECTION` summary; the runner rejects failed checks or a missing summary.

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["linux:andromeda-octane-linux"],"resident_devices":1},"purpose":"GTK projection smoke"}' -- \
  env LINUX_RUNTIME_EVAL_EXECUTABLE=/path/on/linux/ns-linux \
    LINUX_RUNTIME_EVAL_MASON_DIR=/path/on/linux/mason \
    LINUX_RUNTIME_EVAL_ICU_DATA=/path/on/linux/icu77 \
    bun run turbo run test:renderer-fixture --filter=@xplat/linux-runtime-eval -- projection native
```

Replace `native` with `gjs` to run the control on the same host.

## Real renderer port

`port/` runs the shipping renderer (`createGtkRoot` from `@octane-xplat/linux-gtk`) and shared `@octane-xplat/ui` components unchanged on the NativeScript runtime. [GTK bindings](../../packages/cli/src/linux-gtk/bindings.mjs) projects a GObject-style API (constructors, methods, properties, signals, `GObject.registerClass`, GLib sources) onto the runtime's generated C symbols — `beginScope`/`releaseScope` group created objects for teardown checks and own only timers and call-scoped callbacks — driven by a GI description exported from the target host: `research/linux-runtime-port/gi.json` by default — override with `LINUX_RUNTIME_EVAL_GI_SCHEMA` when testing a schema from another host (for example an x86_64 GTK 4.14 export) — produced on a Linux host by `port/export-gi.js` under GJS. Re-export after changing the exporter; transform methods require its `instanceTransfer` field so a native call can consume a reference without invalidating its JavaScript wrapper:

```sh
gjs tools/linux-runtime-eval/port/export-gi.js research/linux-runtime-port/gi.json
# optionally with the facade loaded so XplatMason functions are included:
XPLAT_MASON_TYPELIB=/path/to/facade LD_LIBRARY_PATH=/path/to/facade \
  gjs tools/linux-runtime-eval/port/export-gi.js research/linux-runtime-port/gi.json
```

`port/main.mjs` is a self-checking probe on the same input contract as the slice; `port/gjs-main.mjs` is the same screen through the shipping GI path for geometry parity.

Typecheck the port's direct GTK call against the SDK declarations from the extracted runtime package:

```sh
bun run turbo run typecheck:sdk --filter=@xplat/linux-runtime-eval -- \
  /path/to/extracted/package/framework/typings/index.d.ts
```

The NativeScript port runs that same TypeScript function and checks that `gtk_get_major_version()` agrees with the renderer's projected GTK namespace. Run with the SDK metadata, Mason libraries and ICU data from the prepared runtime:

```sh
LINUX_RUNTIME_EVAL_HOST=andromeda.local LINUX_RUNTIME_EVAL_VM=octane-linux \
LINUX_RUNTIME_EVAL_GI_SCHEMA=/path/to/exported/gi.json \
LINUX_RUNTIME_EVAL_EXECUTABLE=/path/to/task-scratch/prepared/ns-linux \
LINUX_RUNTIME_EVAL_MASON_DIR=/path/to/task-scratch/prepared \
LINUX_RUNTIME_EVAL_ICU_DATA=/path/to/icu77 \
  bun run turbo run test:port --filter=@xplat/linux-runtime-eval
```

The port requires Mason, because Mason is required on every platform ([#281](https://github.com/octane-xplat/octane-xplat/issues/281)). Its `mason-mode` check fails if the renderer falls back to `Gtk.Box`. Build the facade for the target architecture — `packages/linux-gtk-renderer/native/xplatmason/xplatmason.c` + `xplatmason.h` compiled `-shared -fPIC` against `libmason_c.so` (soname `libxplatmason-gtk.so`, `$ORIGIN` rpath), plus `XplatMason-1.0.gir`/`.typelib` from `g-ir-scanner`/`g-ir-compiler` as `native/xplatmason/build.sh` does. The facade needs a `libjson-glib-1.0.so.0` beside it when the host lacks one. Then prepare a second metadata module alongside Mason:

```sh
python3 tools/linux-runtime-eval/prepare-metadata.py \
  --package /path/to/extracted/package \
  --header /path/to/mason_native.h \
  --library /path/to/libmason_c.so \
  --facade-header packages/linux-gtk-renderer/native/xplatmason/xplatmason.h \
  --facade-library /path/to/libxplatmason-gtk.so \
  --output /path/to/task-scratch/prepared-mason
```

`--facade-header`/`--facade-library` is a repeatable pair; the helper strips system includes and declares ABI-equivalent types, so no GTK dev headers are needed on the prepare host. Regenerate `gi.json` with the facade on the typelib path so its functions are projected; run `test:port` with the new `ns-linux`.

The same task runs the GJS control: `LINUX_RUNTIME_EVAL_ENGINE=gjs LINUX_RUNTIME_EVAL_SLICE=port` runs `dist/port-gjs/app.js` under `gjs -m` through the same input driver. GJS needs `LINUX_RUNTIME_EVAL_MASON_DIR` set to a directory containing the facade typelib and its libraries, which becomes `XPLAT_MASON_TYPELIB` + `LD_LIBRARY_PATH` inside the guest. `ns-linux` finds Mason through the bundle's prepared metadata even without it:

```sh
LINUX_RUNTIME_EVAL_HOST=andromeda.local LINUX_RUNTIME_EVAL_VM=octane-linux \
LINUX_RUNTIME_EVAL_ENGINE=gjs \
LINUX_RUNTIME_EVAL_MASON_DIR=/path/to/task-scratch/facade-dir \
  bun run turbo run test:port --filter=@xplat/linux-runtime-eval
```

Compare the ready-record frames between the GJS and NativeScript runs for geometry parity.

Boundaries: the projection is an evaluation harness, not a GJS compatibility layer — it intentionally fails on uncovered calls, and ownership is explicit via scopes rather than GC. `dist/port-gjs` stubs typelibs absent on the probe host (`Soup`, `WebKit`, `JavaScriptCore`, `Xdp`, `Adw`) that the screen never reaches.

### Benchmark and debugging checks

`build:port` also emits `dist/bench-native/app.js` and `dist/bench-gjs/app.js`. Both run the same 200-row screen (`port/bench.mjs`) with the shipping renderer defaults. The benchmark times first mount, a one-label update, an update to all 200 labels, and remounts. Timings stop when the widget state is committed, so GTK painting is excluded. `port/bench.py` adds time from process spawn and the process's own RSS from `/proc`. Run each engine under its own Xvfb display. Alternate the engines between trials, and record host load, because timings are sensitive to it:

```sh
dbus-run-session -- xvfb-run -a python3 tools/linux-runtime-eval/port/bench.py /path/to/prepared/ns-linux tools/linux-runtime-eval/dist/bench-native/app.js
dbus-run-session -- xvfb-run -a env XPLAT_MASON_TYPELIB=/path/to/facade-dir LD_LIBRARY_PATH=/path/to/facade-dir \
  python3 tools/linux-runtime-eval/port/bench.py gjs -m tools/linux-runtime-eval/dist/bench-gjs/app.js
```

`port/cdp-check.py` starts the native benchmark with `--inspect-brk` and drives the Chrome DevTools Protocol using only the Python standard library. It checks three things:

1. A breakpoint inside the renderer's `widgetName` pauses, and an expression evaluates in that frame.
2. A CPU profile of the updates contains renderer and projection functions.
3. A heap snapshot completes.

```sh
dbus-run-session -- xvfb-run -a python3 tools/linux-runtime-eval/port/cdp-check.py /path/to/prepared/ns-linux tools/linux-runtime-eval/dist/bench-native/app.js
```

With `0.1.0-alpha.2`, native C frames in the CPU profile can carry the wrong symbol name, so attribute only JavaScript frames. `0.1.0-alpha.3` and later builds name native frames correctly ([triniwiz/linux-runtime#12](https://github.com/triniwiz/linux-runtime/issues/12)).

## Runtime versions

The v2 projection in [GTK bindings](../../packages/cli/src/linux-gtk/bindings.mjs) targets runtimes at or after main `be71019d8` ([triniwiz/linux-runtime#25](https://github.com/triniwiz/linux-runtime/pull/25)): the runtime wraps every GObject it returns and the wrapper holds its own reference, so the projection does not add GObject references. It observes liveness through weak refs and delegates signal connect/disconnect to the wrapper's own methods.

It does not support `0.1.0-alpha.x` or main up to `0b2fe09a0`, where C-returned GObjects were bare pointers and the projection counted references itself. It throws at load time on those builds because `__nsGObject.object` is missing.

Because liveness follows V8 collection of the wrapper, the drain checks need `NS_V8_FLAGS=--expose-gc` (injected by `run.mjs`) and the probes drop their own handles to dead trees before counting finalizations. The pass criteria themselves stay the same.

Upstream PR [#32](https://github.com/triniwiz/linux-runtime/pull/32) (merged at `57408ba`) fixed signal-handler retention when a handler captures the same object that owns it. The slice now finalizes all 132 created widgets on NativeScript, and the GJS control drains cleanly. Its previous three survivors came from the probe retaining the root handle from its last loop iteration; clearing that local handle fixed the measurement. Cross-object captures can still retain objects as expected, so finalization counts remain scoped evidence rather than a process-wide leak proof.

Observe finalization with `g_object_weak_ref` (native) or a `GBinding`'s source (GJS). Don't use `GOBJECT_DEBUG=instance-count`: on the Debian 13 VM, `g_type_get_instance_count` returns 0 for every type, even live ones.

One local workaround hides a known gap; keep it in mind when reading results:

- `0.1.0-alpha.2` exposes C structs only under their struct tags, such as `_graphene_rect_t`, not their typedef names. `0.1.0-alpha.3` adds the typedef names ([triniwiz/linux-runtime#13](https://github.com/triniwiz/linux-runtime/issues/13)). The projection's struct lookup doesn't try `_graphene_rect_t`, so for Graphene out-parameters it falls back to raw memory with a field map taken from GI. The struct is present in the metadata.

## Integration boundaries

The adapter defers signal delivery until the GTK native action finishes, then lets Octane flush through Promise microtasks. It preserves the caret during controlled rewrites, suppresses synchronous change echoes, disconnects native signals, cancels queued deliveries, and explicitly releases interop callbacks. Replacing GJS requires equivalent ownership and scheduling rules throughout the real renderer; these probe adapters are not a general GJS compatibility layer.

The result does not qualify the shipping UI, selection/IME, Wayland, screen-reader or AT-SPI behavior, other architectures, arbitrary custom widgets, visual parity, or application packaging. The paired accessibility fixtures check GTK accessible metadata only. Object finalization checks count the probe-owned widgets; they do not establish that the entire engine or process is leak-free. Microtask timing covers idle programmatic updates, not OS-event latency or behavior during sustained resize. Keep measured results and raw logs in local reports and Silo, not this README.
