# Minimal JavaScriptCore host feasibility spike

> Historical feasibility record. The JavaScriptCore host has since become the
> experimental packaging path; follow the [current macOS guide](../../README.md#packaging-proof).
> References below to keeping Node as the default describe the earlier spike decision.

**Result (2026-09-28, continued):** The small host links libjs built on macOS's
system JavaScriptCore, libnapi, libuv, and libutf. With the two upstream patches
in `patches/`, it loads a NativeScript framework compiled against
`bare-compat-napi` headers, calls `init()`, and executes `hello-window.js`.
That script creates an `NSApplication` and `NSWindow` and returns the window's
title. The production minified `main.cjs` boots under the C host's CFRunLoop;
the built-in AppKit sweep reports **29 OK checks and zero FAILs or render
errors** across the Home counter, gallery routes, demo interactions, and Test
tab probe. This is a feasibility proof, not a packaging-ready replacement for
Node. Keep the Node packaging default while this remains a spike.

This is a scratch experiment, outside the supported macOS packaging flow. It
uses no signing or notarization. The experiment files here are committed; large
upstream clones, build output, and logs remain under gitignored
`research/bare-macos/`. `sweep-results.txt` retains the 29 assertion lines from
the production minified bundle; the full local log is
`research/bare-macos/minified-sweep.log`.

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
| Full bundle in custom host | A CJS wrapper loads the bundle after addon init. With `OCTANE_MACOS_EXTERNAL_RUNLOOP=1`, `main.mjs` calls `app.finishLaunching()` and lets C own `CFRunLoop`. The built-in macOS sweep reported 29 `OK` checks, zero `FAIL`s, and no logged render errors in both unminified and production minified bundles. The sweep exercises route navigation, counter, stopwatch, Todo text input, Tic-Tac-Toe, Dialer, 500-row List, Weather, Feed, and a Test-tab probe through AppKit debug actions. A 15-second harness run was terminated by the probe after the sweep. No visual inspection was performed. |
| Timer callback | A standalone `setTimeout(..., 10)` test fired through a CoreFoundation timer and exited 0. The full app's sweep also advanced through timers and interval-backed demos. Shutdown and sustained timer load remain unverified. |
| App termination | A scratch shim scheduled `NSApplication.sharedApplication.terminate(null)` after 2 seconds. The process exited 0, but the host's `host run loop returned` marker did not print. AppKit appears to exit the process before the host's cleanup path; graceful JS and native teardown remain unproven. |

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
implement only the property-name mode NativeScript uses. The final Test-tab
error, `TypeError: undefined is not an object (evaluating 't.origin.x')`, came
from libjsc giving native class instances `Object.prototype` instead of the
constructor's `prototype`. Correcting that in `js__on_constructor_call` fixed
`NSRect` fields and also removed an earlier
`CTFontDescriptorCopyAttribute`/`CoreFoundation CFEqual` crash.
Letting the bundle call `app.run()` initially kept the outer JS call active;
the sweep's timer fired, but its async continuation did not advance. The
opt-in external-run-loop path in `main.mjs` is necessary for the JSC host.

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
upstream metadata generator. From the runtimes clone, the upstream
`./scripts/build_all_react_native.sh --no-engine --embed-metadata --macos
--no-iphone --no-simulator` builds the generator and metadata, then may fail in
its Deno-selected npm packaging stage. The direct CMake build below uses the
generated metadata and bypasses that packaging stage. The
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
`Buffer.from`, and the four `node:` modules this bundle imports. Font SHA-256
uses the bridged `CC_SHA256` function; font files use Foundation's file APIs.
Reproduce the
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

Terminate this command after the sweep logs; the C host owns the main
CFRunLoop. The host is 251 C lines and the shim 47 JS lines. The generated dylibs total
about 492 KB (`libjs` 128 KB, `libnapi` 88 KB, `libuv` 200 KB, `libutf` 76 KB),
plus a 56 KB host and a 5.2 MB NativeScript framework. These are uncompressed
local build sizes; macOS supplies JavaScriptCore. A distributable binary may
need different linking and size work.

## Gap and next investigation

The bundle shim is still narrowly scoped. Its Foundation-backed file operations
cover only the bundled font path, and its CJS loader supports one blob and five
imports without general module resolution. The 29 checks call AppKit actions
and inspect AppKit-backed labels, but no pixel-level, manual input, window-close,
or graceful process-shutdown behavior was verified. The experimental host uses libuv and
libutf as supporting libraries even though JavaScriptCore itself is supplied by
macOS. The addon and libjsc patches are local spike patches, not upstream fixes.

**Estimate:** turning this proof into a maintainable host is roughly 1–2 weeks
for upstream-quality libjsc/NativeScript fixes, complete error handling for
the measured Node shim, and lifecycle/teardown tests. General-purpose Node
module compatibility would be additional work if future bundles import more
APIs. Keep the Node host for supported packaging until that work passes.

No public workflow or API changed, so no recipe is affected.
