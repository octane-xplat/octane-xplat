# Minimal JavaScriptCore host feasibility spike

**Result (2026-09-28):** The small host links libjs built on macOS's system
JavaScriptCore, libnapi, libuv, and libutf. It loads the NativeScript Node-API
framework and calls `init()`. The bridge does not expose `NSApplication` in
this host, so the hello window and the shared Octane harness have **not** booted.
Do not change the Node packaging default based on this spike.

This is a scratch experiment, outside the supported macOS packaging flow. It
uses no signing or notarization. The experiment files here are committed; large
upstream clones, build output, and logs remain under gitignored
`research/bare-macos/`.

## What ran

Environment: Apple Silicon, macOS/Xcode 26.6, Node 26.10.0 for build tools.
The initial Bare CLI experiment used package `bare@1.33.5` with executable
`Bare.version` **1.33.4**. The final host does not use the Bare runtime.

| Stage | Observed result |
| --- | --- |
| Bare CLI plus shipped `NativeScript.framework` | `new Bare.Addon(url)` exposes `init`; `init()` creates ObjC globals. `NSObject.alloc()`, `NSWindow.alloc()`, and `NSApplication.sharedApplication` each throw `Object is already wrapped`. Thus the prior claim that the binary cannot load was too strong. |
| NativeScript source build | `NativeScript/runtimes` at `5b697b3` generated metadata and built `dist/intermediates/macos/RelWithDebInfo/NativeScript.framework` successfully. Its packaging stage then failed: `Could not resolve "react-native-node-api" ... Deno expects the node_modules/ directory to be up to date`. The upstream script selected Deno automatically. The rebuilt framework has the same `Object is already wrapped` Bare behavior. |
| Rebuild with `bare-compat-napi` forced into compilation | Configure succeeds. Compile fails in `NativeScript/napi/common/js_native_tsfn.h`: `typedef redefinition with different types ('void *' vs 'struct napi_threadsafe_function__ *')`, then conflicting `napi_threadsafe_function_release_mode` and `napi_threadsafe_function_call_mode` definitions. The source has its own Node-API declarations; an include-path switch is insufficient. |
| Minimal host | `libjsc` at `8ebb40f`, `libnapi` at `b4c5a66`, and `libjs` at `7031ca1` build. The host opens the framework with `dlopen`, finds `napi_register_module_v1`, and calls `init` through libjs. It logs `NativeScript init completed` and `objc global: [object Object]`, then `ReferenceError: Can't find variable: NSApplication`. Passing the generated `metadata.macos.arm64.nsmd` directly to `nativescript_init` gives the same result. Both the shipped and newly built frameworks were tried. |
| Packaged harness bundle | `pnpm exec vite build --config vite.package.config.mjs` in `apps/macos` fails before `main.cjs` exists: `[MISSING_EXPORT] "__s" is not exported by ... octane/dist/universal-native.js` (also `bag0`, `clone`, `template` from Pager and Video macOS sources). No full bundle was fed to the host. |

The rebuilt framework loads under Node and `NSApplication.sharedApplication`
works there. That isolates the custom-host failure to this runtime combination
or its integration, rather than proving that the framework build is unusable.
The `NSApplication` cause is not yet identified; `init` registers some globals,
but class globals are absent. The `bare-compat-napi` header conflict may be a
separate issue.

## Reproduce the custom host

The local clone directory is retained in this worktree. To reconstruct it in a
fresh worktree, clone `holepunchto/libjsc`, `libjs`, and `libnapi` into
`research/bare-macos/` and install `libjsc` and `libnapi` development packages
with `pnpm install --dir`. `CMakeLists.txt` points at those clones through
`SPIKE_DEPS_DIR` (override it if they live elsewhere).

```sh
cmake -S apps/macos/spikes/bare-macos -B research/bare-macos/host-build -DCMAKE_BUILD_TYPE=Release
cmake --build research/bare-macos/host-build --target minimal-host -j 8
research/bare-macos/host-build/minimal-host \
  apps/macos/node_modules/@nativescript/macos-node-api/build/RelWithDebInfo/NativeScript.apple.node/macos-arm64/NativeScript.framework/Versions/A/NativeScript \
  apps/macos/spikes/bare-macos/hello-window.js
```

The host evaluates the supplied script through `js_run_script()` and then
briefly runs `CFRunLoop`. It is deliberately missing CJS loading, timers,
console, and lifecycle integration; the hello window is the gate before those
are useful. The generated dylibs on this machine total about 480 KB
(`libjs` 124 KB, `libnapi` 86 KB, `libuv` 198 KB, `libutf` 73 KB), with a
35 KB host executable. These are uncompressed local build sizes, excluding the
7 MB NativeScript framework and OS JavaScriptCore. A distributable binary may
need different linking and size work.

## Gap and next investigation

First, make the NativeScript bridge's class registration work on libnapi/libjsc.
Trace ignored `napi_define_properties` results in `Class.mm` and compare the
same metadata and addon under Node and this host. Reconcile the upstream
`js_native_tsfn.h` declarations with `bare-compat-napi` before claiming a
Bare-targeted rebuild. Then run `hello-window.js` and check the AppKit main
thread, CFRunLoop, teardown, and callback behavior. Only after that should the
host grow a minimal CJS wrapper and the globals required by `main.cjs`.
The current host must also gain module resolution for imports left external by
Vite, plus `console`, timers, `process.env`, and enough `node:` compatibility
for the actual bundle. Fix the unrelated Octane export/build error before
measuring those requirements.

**Estimate:** resolving the bridge/header mismatch is uncertain and could take
several days to more than a week. Once a window works, a one-bundle CJS host
and AppKit lifecycle proof are plausibly another 1–2 weeks; full harness parity
could take longer if the bundle uses Node APIs or native callbacks that require
substantial shims. The current evidence does not justify a packaging switch.

No public workflow or API changed, so no recipe is affected.
