# Minimal JavaScriptCore host feasibility spike

**Result (2026-09-28, continued):** The small host links libjs built on macOS's
system JavaScriptCore, libnapi, libuv, and libutf. With the two upstream patches
in `patches/`, it loads a NativeScript framework compiled against
`bare-compat-napi` headers, calls `init()`, and executes `hello-window.js`.
That script creates an `NSApplication` and `NSWindow` and returns the window's
title. The shared Octane harness has not yet booted. Keep the Node packaging
default while this remains a spike.

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
| Rebuild with `bare-compat-napi` forced into compilation | After reconciling the duplicate thread-safe-function declarations and the internal `napi_runtime` type, the Xcode framework build succeeds. `-include bare/module.h` supplies the compatibility Node-API headers. This build is the one used for the passing window test. |
| Minimal host | `libjsc` at `8ebb40f`, `libnapi` at `b4c5a66`, and `libjs` at `7031ca1` build. The host opens the framework with `dlopen`, finds `napi_register_module_v1`, and calls `init` through libjs. The patched libjsc handles accessor properties and native class prototypes; the patched NativeScript bridge avoids a duplicate wrap. The hello script returns `libjsc NativeScript smoke` and the host exits 0 after running `CFRunLoop` briefly. This proves script-level window creation; no visual inspection was performed. |
| Packaged harness bundle | `pnpm exec vite build --config vite.package.config.mjs` in `apps/macos` fails before `main.cjs` exists: `[MISSING_EXPORT] "__s" is not exported by ... octane/dist/universal-native.js` (also `bag0`, `clone`, `template` from Pager and Video macOS sources). No full bundle was fed to the host. |

The initial missing `NSApplication` was caused by libjsc's unimplemented
accessor-property path: metadata classes are registered as accessors on the
global object. The window path also needed distinct mutable class prototypes
and a failed `napi_unwrap` probe that does not leave a pending exception.
The latter libjsc change deserves upstream review because it changes the
failure behavior of the lower-level `js_unwrap` API.

## Reproduce the custom host

The local clone directory is retained in this worktree. In a fresh worktree,
clone `holepunchto/libjsc` (`8ebb40f`), `libjs` (`7031ca1`), `libnapi`
(`b4c5a66`), and `NativeScript/runtimes` (`5b697b3`) into
`research/bare-macos/`. Apply `patches/libjsc.patch` and
`patches/nativescript-runtimes.patch` in their respective clones. Install
`libjsc` and `libnapi` development dependencies with `pnpm install --dir`,
and `bare-compat-napi@1.4.1` under `research/bare-macos/node_modules`.
`CMakeLists.txt` points at those clones through `SPIKE_DEPS_DIR`.

Generate `metadata-generator/metadata/metadata.macos.arm64.nsmd` with the
upstream metadata generator (`npm run metagen macos` after building it). The
local generated file was 4,698,711 bytes. From the runtimes clone, configure
and build the patched framework with:

```sh
cmake -S NativeScript -B dist/bare-compat-build -G Xcode \
  -DTARGET_PLATFORM=macos -DTARGET_ENGINE=none -DNS_FFI_BACKEND=napi \
  -DNS_GSD_BACKEND=none -DMETADATA_SIZE=4698711 \
  -DCMAKE_CXX_FLAGS="-DBARE_COMPAT_NAPI -include $PWD/../node_modules/bare-compat-napi/include/bare/module.h -I$PWD/../node_modules/bare-compat-napi/include -I/opt/homebrew/Cellar/node/26.10.0_1/include/node -I/opt/homebrew/include"
cmake --build dist/bare-compat-build --config RelWithDebInfo -j 4 -- CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO
```

The Homebrew include paths above are machine-specific build inputs; replace
them for another toolchain. This command builds the addon directly and avoids
the unrelated upstream Deno packaging failure.

```sh
cmake -S apps/macos/spikes/bare-macos -B research/bare-macos/host-build -DCMAKE_BUILD_TYPE=Release
cmake --build research/bare-macos/host-build --target minimal-host -j 8
research/bare-macos/host-build/minimal-host \
  research/bare-macos/runtimes/dist/bare-compat-build/RelWithDebInfo/NativeScript.framework/Versions/A/NativeScript \
  apps/macos/spikes/bare-macos/hello-window.js \
  research/bare-macos/runtimes/metadata-generator/metadata/metadata.macos.arm64.nsmd
```

The host evaluates the supplied script through `js_run_script()` and then
briefly runs `CFRunLoop`. It still needs CJS loading, timers, console, and
lifecycle integration for the full harness. The generated dylibs on this
machine total about 480 KB
(`libjs` 124 KB, `libnapi` 86 KB, `libuv` 198 KB, `libutf` 73 KB), with a
35 KB host executable. These are uncompressed local build sizes, excluding the
7 MB NativeScript framework and OS JavaScriptCore. A distributable binary may
need different linking and size work.

## Gap and next investigation

The window gate now passes at script level. Check AppKit main-thread behavior,
CFRunLoop lifetime, teardown, and native callback behavior under the full app.
The host must grow a CJS wrapper and the globals required by `main.cjs`.
The current host must also gain module resolution for imports left external by
Vite, plus `console`, timers, `process.env`, and enough `node:` compatibility
for the actual bundle. Fix the unrelated Octane export/build error before
measuring those requirements.

**Estimate:** the bridge/header work took a small patch but still needs
upstream-quality tests. A one-bundle CJS host and AppKit lifecycle proof are
plausibly another 1–2 weeks; full harness parity could take longer if the
bundle uses Node APIs or native callbacks that require substantial shims.

No public workflow or API changed, so no recipe is affected.
