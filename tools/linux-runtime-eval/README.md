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

The native engine always receives `NS_V8_FLAGS=--expose-gc`: runtime wrappers hold the only GObject reference, so the drain checks must be able to force V8 collections rather than just waiting.

To run on a remote Linux host (for example `andromeda.local`'s OrbStack VM `octane-linux`), set `LINUX_RUNTIME_EVAL_HOST` to the ssh host; `LINUX_RUNTIME_EVAL_VM` then names the OrbStack VM on that host instead of a local one. `LINUX_RUNTIME_EVAL_EXECUTABLE` and `LINUX_RUNTIME_EVAL_MASON_DIR` are paths on the remote Linux side. The runner stages `input.py` and the entry's dist directory into a VM-local `/tmp/xplat-lre-*` directory and removes it afterwards:

```sh
LINUX_RUNTIME_EVAL_HOST=andromeda.local \
LINUX_RUNTIME_EVAL_VM=octane-linux \
LINUX_RUNTIME_EVAL_EXECUTABLE=/Users/alec/agent-scratch/.../ns-linux \
  bun run turbo run test:runtime --filter=@xplat/linux-runtime-eval
```

## Real renderer port

`port/` runs the shipping renderer (`createGtkRoot` from `@octane-xplat/linux-gtk`) and shared `@octane-xplat/ui` components unchanged on the NativeScript runtime. `port/bindings.mjs` projects a GObject-style API (constructors, methods, properties, signals, `GObject.registerClass`, GLib sources) onto the runtime's generated C symbols — `beginScope`/`releaseScope` group created objects for teardown checks and own only timers and call-scoped callbacks — driven by a GI description exported from the target host: `research/linux-runtime-port/gi.json` by default — override with `LINUX_RUNTIME_EVAL_GI_SCHEMA` when testing a schema from another host (for example an x86_64 GTK 4.14 export) — produced on a Linux host by `port/export-gi.js` under GJS:

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
LINUX_RUNTIME_EVAL_VM=gtk-smoke LINUX_RUNTIME_EVAL_ENGINE=gjs \
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

The v2 projection in `port/bindings.mjs` targets runtimes at or after main `be71019d8` ([triniwiz/linux-runtime#25](https://github.com/triniwiz/linux-runtime/pull/25)): the runtime wraps every GObject it returns and the wrapper holds its own reference, so the projection owns no GObject references at all. It observes liveness through weak refs, delegates signal connect/disconnect to the wrapper's own methods, and drops only the caller-side reference of transfer-full returns for owned (non-floating) types.

It does not support `0.1.0-alpha.x` or main up to `0b2fe09a0`, where C-returned GObjects were bare pointers and the projection counted references itself. It throws at load time on those builds because `__nsGObject.object` is missing.

Because liveness follows V8 collection of the wrapper, the drain checks need `NS_V8_FLAGS=--expose-gc` (injected by `run.mjs`) and the probes drop their own handles to dead trees before counting finalizations. The pass criteria themselves stay the same.

On `be71019d8` the port's `cycle-pending-drained` and the slice's `native-widget-finalization` still fail. Functional checks pass. The cause is a runtime gap, not a renderer regression: the runtime keeps a signal handler's closure alive until disconnect or finalize. A handler that reaches its own object, like the renderer's `GtkTextView` `map`/`unmap` handlers, therefore keeps that object alive forever. GJS traces handler closures from the object's wrapper and collects such cycles.

Observe finalization with `g_object_weak_ref` (native) or a `GBinding`'s source (GJS). Don't use `GOBJECT_DEBUG=instance-count`: on the Debian 13 VM, `g_type_get_instance_count` returns 0 for every type, even live ones.

One local workaround hides a known gap; keep it in mind when reading results:

- `0.1.0-alpha.2` exposes C structs only under their struct tags, such as `_graphene_rect_t`, not their typedef names. `0.1.0-alpha.3` adds the typedef names ([triniwiz/linux-runtime#13](https://github.com/triniwiz/linux-runtime/issues/13)). The projection's struct lookup doesn't try `_graphene_rect_t`, so for Graphene out-parameters it falls back to raw memory with a field map taken from GI. The struct is present in the metadata.

## Integration boundaries

The adapter defers signal delivery until the GTK native action finishes, then lets Octane flush through Promise microtasks. It preserves the caret during controlled rewrites, suppresses synchronous change echoes, disconnects native signals, cancels queued deliveries, and explicitly releases interop callbacks. Replacing GJS requires equivalent ownership and scheduling rules throughout the real renderer; these probe adapters are not a general GJS compatibility layer.

The result does not qualify the shipping UI, selection/IME, Wayland, accessibility, x86_64, arbitrary custom widgets, visual parity, or application packaging. Object finalization checks count the probe-owned widgets; they do not establish that the entire engine or process is leak-free. Microtask timing covers idle programmatic updates, not OS-event latency or behavior during sustained resize. Keep measured results and raw logs in local reports and Silo, not this README.
