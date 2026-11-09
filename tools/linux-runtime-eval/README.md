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

## Integration boundaries

The adapter defers signal delivery until the GTK native action finishes, then lets Octane flush through Promise microtasks. It preserves the caret during controlled rewrites, suppresses synchronous change echoes, disconnects native signals, cancels queued deliveries, and explicitly releases interop callbacks. Replacing GJS requires equivalent ownership and scheduling rules throughout the real renderer; these probe adapters are not a general GJS compatibility layer.

The result does not qualify the shipping UI, selection/IME, Wayland, accessibility, x86_64, arbitrary custom widgets, visual parity, or application packaging. Object finalization checks count the probe-owned widgets; they do not establish that the entire engine or process is leak-free. Microtask timing covers idle programmatic updates, not OS-event latency or behavior during sustained resize. Keep measured results and raw logs in local reports and Silo, not this README.
