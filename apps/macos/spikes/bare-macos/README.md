# Minimal JavaScriptCore host feasibility spike

**Result (2026-09-28, continued):** The small host links libjs built on macOS's
system JavaScriptCore, libnapi, libuv, and libutf. With the two upstream patches
in `patches/`, it loads a NativeScript framework compiled against
`bare-compat-napi` headers, calls `init()`, and executes `hello-window.js`.
That script creates an `NSApplication` and `NSWindow` and returns the window's
title. With a deliberately incomplete host shim, the production minified
`main.cjs` also reaches the shared Octane Home render and enters `app.run()`.
This is a **conditional boot proof**, not a packaging-ready replacement for
Node. Keep the Node packaging default while this remains a spike.

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
| Packaged harness bundle | The first build failed with `[MISSING_EXPORT] "__s" is not exported by ... octane/dist/universal-native.js` (also `bag0`, `clone`, `template`). Pager and Video macOS files were missing from the Vite renderer rules. Adding those two rules produced `dist/package-build/main.cjs` (654.52 KB minified; 172 modules). |
| Full bundle in custom host | A CJS wrapper loads the bundle after addon init. A 5-second run logged `[harness] App module evaluated`, `[harness] App render, tab=0`, `[harness] Home render, items=5 scheme=light`, and `[macos-bundle] component rendered`, then remained in `app.run()` until the probe sent SIGTERM. The same result held for the normal minified build. No visual inspection or input event verification was performed. |
| Timer callback | A standalone `setTimeout(..., 10)` test fired through a CoreFoundation timer and exited 0. The full app's timer behavior and shutdown remain unverified. |

The initial missing `NSApplication` was caused by libjsc's unimplemented
accessor-property path: metadata classes are registered as accessors on the
global object. The window path also needed distinct mutable class prototypes
and a failed `napi_unwrap` probe that does not leave a pending exception.
The full bundle also needed a nonthrowing status for duplicate `js_wrap` and
unwrapped `js_remove_wrap`, plus the own-string-key branch of libjsc's
previously unsupported `js_get_filtered_property_names()`. Without the latter,
NativeScript's class builder passes an uninitialized value to
`napi_get_array_length` and crashes in JavaScriptCore. These libjsc changes
deserve upstream review because they change lower-level failure behavior and
implement only the property-name mode NativeScript uses.

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
cmake -S apps/macos/spikes/bare-macos -B research/bare-macos/host-spike-build -DCMAKE_BUILD_TYPE=Release
cmake --build research/bare-macos/host-spike-build --target minimal-host -j 8
research/bare-macos/host-spike-build/minimal-host \
  research/bare-macos/runtimes/dist/bare-compat-build/RelWithDebInfo/NativeScript.framework/Versions/A/NativeScript \
  apps/macos/spikes/bare-macos/hello-window.js \
  research/bare-macos/runtimes/metadata-generator/metadata/metadata.macos.arm64.nsmd
```

The host evaluates the supplied script through `js_run_script()` and then
briefly runs `CFRunLoop`. For the bundle it wraps the script in a CJS function,
supplies `exports`, `require`, `module`, and path arguments, then calls it.
`bundle-shim.js` supplies console, `process.env`, timers, `queueMicrotask`,
`Buffer.from`, and the four `node:` modules this bundle imports. Reproduce the
conditional bundle boot after running `pnpm exec vite build --config
vite.package.config.mjs` in `apps/macos`:

`class-registration.js` isolates the `NativeClass` path that previously
crashed, while `timer-smoke.js` isolates the CFRunLoop timer callback.

```sh
research/bare-macos/host-spike-build/minimal-host \
  research/bare-macos/runtimes/dist/bare-compat-build/RelWithDebInfo/NativeScript.framework/Versions/A/NativeScript \
  apps/macos/dist/package-build/main.cjs \
  research/bare-macos/runtimes/metadata-generator/metadata/metadata.macos.arm64.nsmd \
  apps/macos/spikes/bare-macos/bundle-shim.js
```

Terminate this command after the startup logs; `app.run()` owns the main thread.
The host is 239 C lines and the shim 38 JS lines. The generated dylibs total
about 492 KB (`libjs` 128 KB, `libnapi` 88 KB, `libuv` 200 KB, `libutf` 76 KB),
plus a 56 KB host and a 5.2 MB NativeScript framework. These are uncompressed
local build sizes; macOS supplies JavaScriptCore. A distributable binary may
need different linking and size work.

## Gap and next investigation

The bundle shim is an experiment. Its SHA-256 digest returns a fixed
`bare-spike` string, so font-cache naming is not correct. It replaces
`CTFontDescriptorCopyAttribute` with a JS object whose path matches the
cached font. Without that override, the native call crashes in
`CoreFoundation CFEqual` from `CTFontDescriptorCopyAttribute` when passed
`kCTFontURLAttribute`; the LLDB stack runs through NativeScript's
`CFunction::jsCallDirect`. This is an outstanding bridge/CFType conversion
blocker. The shim's Foundation-backed file operations cover only the bundled
font path. Its CJS loader supports one blob and five imports, without general
module resolution. Timers run on CFRunLoop, but teardown, intervals under load,
and native callback behavior still need checks. No pixel or interaction parity
was established.

**Estimate:** turning this proof into a maintainable host is roughly 1–2 weeks
for upstream-quality libjsc/NativeScript fixes, real SHA-256 and file errors,
bundle loading and lifecycle tests. The CoreText conversion crash could extend
that estimate if it reflects a wider CFType bridge issue. Keep the Node host
for supported packaging until that work and interaction validation pass.

No public workflow or API changed, so no recipe is affected.
