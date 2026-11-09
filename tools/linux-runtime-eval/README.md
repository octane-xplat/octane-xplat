# Evaluate the NativeScript Linux runtime

This private probe compares a small compiled Octane screen on NativeScript's Linux V8 runtime and GJS. It does not change the shipping GTK renderer. It is a feasibility check, not production qualification.

The NativeScript adapter uses GTK C functions, a JavaScript-defined `GtkLayoutManager`, and the real Mason C engine. The GJS control uses `Gtk.Box`; its input and lifecycle checks are comparable, but it does not compare Mason implementations. The adapter deliberately covers only the four widgets in this screen.

## Build

From the repository root, with Bun 1.4.4 and workspace dependencies installed:

```sh
bun run turbo run build typecheck --filter=...@xplat/linux-runtime-eval
```

The generated `dist/native/slice.js` and `dist/gjs/slice.js` are disposable. The checked-in screen tests a counter, uppercase-controlled text, stable widget identity, 100 microtask updates, 20 mount/unmount cycles, cancellation of a queued event, and a five-second drain. Native checks also observe Mason geometry, leaf measurement callbacks, and GObject finalization.

## Prepare the NativeScript runtime

Use an actual Linux ARM64 host with GTK4, GJS, Python 3, D-Bus, Xvfb, X11, and XTest libraries. No screenshots are captured. Reserve that host before running native tools. The remote mode below reuses an existing OrbStack VM and requires this checkout to be mounted at the same absolute path inside it.

Obtain `@nativescript/linux@0.1.0-alpha.2`, verify its npm integrity, and extract it into disposable task storage. Build a Linux ARM64 `libmason_c.so` from the matching Mason source; this tool consumes that artifact rather than managing Rust toolchains. Use that source's public `mason_native.h`. Keep the source revision and dependency lock alongside the run evidence.

Prepare a fresh task-owned executable directory on Linux; the output path must not exist:

```sh
python3 tools/linux-runtime-eval/prepare-metadata.py \
  --package /path/to/extracted/package \
  --header /path/to/mason_native.h \
  --library /path/to/libmason_c.so \
  --output /path/to/task-scratch/prepared
```

The helper copies the executable, SDK metadata, and Mason library; generates additional metadata under `metadata/`; and records input hashes. The runtime finds extra metadata and `lib/` beside its executable. The generated module uses a library name rather than an absolute library path, so the prepared directory can move. This is a probe bundle, not an installer or complete application package.

## Run with OS input

Run from the repository root under an owned Linux host reservation. For the existing `gtk-smoke` VM, wrap each command with `goddard-agent resource run` reserving `exclusive:["linux:gtk-smoke"]` and `resident_devices:1`. Preparation also needs `native_builds:1`. Leave an existing user-owned VM running after releasing the reservation.

```sh
LINUX_RUNTIME_EVAL_VM=gtk-smoke \
LINUX_RUNTIME_EVAL_EXECUTABLE=/path/to/task-scratch/prepared/ns-linux \
  bun run turbo run test:runtime --filter=@xplat/linux-runtime-eval

LINUX_RUNTIME_EVAL_VM=gtk-smoke LINUX_RUNTIME_EVAL_ENGINE=gjs \
  bun run turbo run test:runtime --filter=@xplat/linux-runtime-eval
```

Omit `LINUX_RUNTIME_EVAL_VM` when running directly on Linux. The runner creates an isolated Xvfb display and session bus, waits for widget geometry, then sends an XTest click and the keys `abc`. It requires successful assertions, a completion record, a zero process exit, and no GTK/GJS critical diagnostics. A timeout or missing completion fails the run. Its processes and display stop at the end.

## Real renderer port

`port/` runs the shipping renderer (`createGtkRoot` from `@octane-xplat/linux-gtk`) and shared `@octane-xplat/ui` components unchanged on the NativeScript runtime. `port/bindings.mjs` projects a GObject-style API (constructors, methods, properties, signals, `GObject.registerClass`, GLib sources, explicit `beginScope`/`releaseScope` ownership) onto the runtime's generated C symbols, driven by a GI description exported from the target host: `research/linux-runtime-port/gi.json`, produced on a Linux host by `port/export-gi.js` under GJS:

```sh
gjs tools/linux-runtime-eval/port/export-gi.js research/linux-runtime-port/gi.json
# optionally with the facade loaded so XplatMason functions are included:
XPLAT_MASON_TYPELIB=/path/to/facade LD_LIBRARY_PATH=/path/to/facade \
  gjs tools/linux-runtime-eval/port/export-gi.js research/linux-runtime-port/gi.json
```

`port/main.mjs` is a self-checking probe on the same input contract as the slice; `port/gjs-main.mjs` is the same screen through the shipping GI path for geometry parity.

```sh
bun run turbo run build:port --filter=@xplat/linux-runtime-eval   # dist/port-native + dist/port-gjs
LINUX_RUNTIME_EVAL_VM=gtk-smoke \
LINUX_RUNTIME_EVAL_EXECUTABLE=/path/to/task-scratch/prepared/ns-linux \
  bun run turbo run test:port --filter=@xplat/linux-runtime-eval
```

To exercise real Mason (`imports.gi.XplatMason` instead of the renderer's `Gtk.Box` fallback), build the facade for Linux ARM64 — `packages/linux-gtk-renderer/native/xplatmason/xplatmason.c` + `xplatmason.h` compiled `-shared -fPIC` against `libmason_c.so` (soname `libxplatmason-gtk.so`, `$ORIGIN` rpath), plus `XplatMason-1.0.gir`/`.typelib` from `g-ir-scanner`/`g-ir-compiler` as `native/xplatmason/build.sh` does. The facade needs a `libjson-glib-1.0.so.0` beside it when the host lacks one. Then prepare a second metadata module alongside Mason:

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

The same task runs the GJS control: `LINUX_RUNTIME_EVAL_ENGINE=gjs LINUX_RUNTIME_EVAL_SLICE=port` runs `dist/port-gjs/app.js` under `gjs -m` through the same input driver. Set `LINUX_RUNTIME_EVAL_MASON_DIR` to a directory containing the facade typelib and its libraries to make both engines use real Mason — it becomes `XPLAT_MASON_TYPELIB` + `LD_LIBRARY_PATH` inside the guest:

```sh
LINUX_RUNTIME_EVAL_VM=gtk-smoke LINUX_RUNTIME_EVAL_ENGINE=gjs \
LINUX_RUNTIME_EVAL_MASON_DIR=/path/to/task-scratch/facade-dir \
  bun run turbo run test:port --filter=@xplat/linux-runtime-eval
```

Compare the ready-record frames between the GJS and NativeScript runs for geometry parity.

Boundaries: the projection is an evaluation harness, not a GJS compatibility layer — it intentionally fails on uncovered calls, and ownership is explicit via scopes rather than GC. `dist/port-gjs` stubs typelibs absent on the probe host (`Soup`, `WebKit`, `JavaScriptCore`, `Xdp`, `Adw`) that the screen never reaches.

Two local workarounds hide known gaps; keep them in mind when reading results:

- NativeScript Linux `0.1.0-alpha.2` metadata omits some GTK-stack structs, such as `graphene_rect_t`. For those out-parameters, the projection allocates raw memory with a field map taken from GI.
- `root.unmount()` leaves the renderer's window signal handlers and controllers attached ([#229](https://github.com/octane-xplat/octane-xplat/issues/229)). `port/main.mjs` removes them itself (`unwireContainer`) before checking that each remount cycle leaves native counts flat.

## Integration boundaries

The adapter defers signal delivery until the GTK native action finishes, then lets Octane flush through Promise microtasks. It preserves the caret during controlled rewrites, suppresses synchronous change echoes, disconnects native signals, cancels queued deliveries, and explicitly releases interop callbacks. Replacing GJS requires equivalent ownership and scheduling rules throughout the real renderer; these probe adapters are not a general GJS compatibility layer.

The result does not qualify the shipping UI, selection/IME, Wayland, accessibility, x86_64, arbitrary custom widgets, visual parity, or application packaging. Object finalization checks count the probe-owned widgets; they do not establish that the entire engine or process is leak-free. Microtask timing covers idle programmatic updates, not OS-event latency or behavior during sustained resize. Keep measured results and raw logs in local reports and Silo, not this README.
