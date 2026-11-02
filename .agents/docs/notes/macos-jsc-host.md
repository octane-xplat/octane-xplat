# AppKit JavaScriptCore host notes

Runtime quirks and verified capabilities of the packaged/dev AppKit host
(`packages/cli/src/macos/jsc-host/` — prebuilt libjs env + NativeScript
node-api bridge + `metadata.nsmd` + `shim.js` bootstrap).

## `WebSocket` via `NSURLSessionWebSocketTask`

The shim installs `globalThis.WebSocket` (shim.js, both dev and packaged
bootstraps flow through `writeNativeBootstrap`). Runtime-verified on the
prebuilt host 2026-10-25: `ws://` handshake, `Sec-WebSocket-Protocol`
negotiation, text and binary (`ArrayBuffer`) echo, peer-initiated close with
code/reason, local `close(code, reason)`, refused-connection `error` +
`close(1006)`, and constructor/`send`/`close` validation errors. Maintained
regression: `node packages/cli/test/verify-macos-websocket.mjs` (Apple
Silicon only; spawns a real RFC 6455 server and the prebuilt host).

`binaryType` defaults to and stays `'arraybuffer'` — the host has no `Blob`.
`wss://` is implemented (same `NSURLSessionWebSocketTask` path) but only
`ws://` loopback is runtime-verified.

### Class-cluster wrapper gap (upstream)

- **Owner**: NativeScript node-api bridge (`@nativescript/macos-node-api`,
  runtimes pin `5b697b39` in `jsc-host/prebuilt/manifest.json`).
- **Observed**: `NSURLSession.sharedSession.webSocketTaskWithURL` returns a
  task whose JS wrapper exposes `NSURLSessionTask` members only —
  `sendMessageCompletionHandler`/`receiveMessageWithCompletionHandler` are
  `undefined` on the wrapper, so calls throw `TypeError … is not a
function`. `NSURLSessionWebSocketTask` itself is fully bridged (its
  prototype has every ws member) and `isKindOfClass:` reports `true`.
- **Cause (runtime evidence)**: the concrete object is
  `__NSURLSessionWebSocketTask` (`object_getClass` chain
  `__NSURLSessionWebSocketTask → __NSCFLocalSessionTask → NSURLSessionTask →
NSObject`) — a private class-cluster implementation that does not inherit
  the public `NSURLSessionWebSocketTask`. The bridge resolves the wrapper by
  walking the real isa chain to the first metadata-registered class, which
  is `NSURLSessionTask`. Private `__NSURLSessionWebSocketTask` cannot enter
  public-header metadata, so the ws level is never reached.
- **Workaround**: `shim.js` re-points the wrapper
  (`Object.setPrototypeOf(task, NSURLSessionWebSocketTask.prototype)`) when
  `receiveMessageWithCompletionHandler` is missing; every member then
  dispatches correctly (`closeCode`/`closeReason` included). Scoped to the
  ws task instance; no other wrapper is touched.
- **Removal condition**: upstream wrapper resolution that honors declared
  return types or metadata on cluster fronts. Recheck after a runtimes pin
  bump — if the task arrives with ws members present, the guard becomes a
  no-op.

### Close reporting

A peer close surfaces on the outstanding
`receiveMessageWithCompletionHandler` as a transport error
(`NSPOSIXErrorDomain` "Socket is not connected") before — or instead of —
`URLSession:webSocketTask:didCloseWithCode:reason:` firing. The task's
`closeCode`/`closeReason` accessors already carry the negotiated values at
that point, so the shim reads them to emit a clean `close` event instead of
a spurious `error` + `1006`. Locally initiated `close(code, reason)` does
reach `didCloseWithCode` — both paths are covered.

## `interop.Pointer` cache re-entrancy (upstream, patched)

`g_pointerCache` in `ffi/napi/Interop.mm` is not safe against re-entrant
finalization. `Pointer::finalize` defers through `PostFinalizer`, which runs
the cleanup **inline** when GC finalizes on the JS thread — and JSC can
finalize inside any napi call that allocates. `getCachedPointer` /
`cachePointer` / `interop_free` all hold `unordered_map` iterators across
napi calls, so an inline `finalizePointerNow` erases nodes underneath them:
the outer frame then dereferences a recycled iterator (`__hash_table::remove`
on a freed node) or reads a stale `napi_ref` (`napi_delete_reference(env,
NULL)` faulting at `js_delete_reference`). Both surfaced as intermittent
SIGSEGVs during `run_file` eval once 124e0acdf's `NativeClass`/`extends`
bridge work increased pointer-cache churn at boot — timing-dependent, not a
script bug.

- **Workaround**: `patches/nativescript-runtimes.patch` makes
  `Pointer::finalize` always defer `finalizePointerNow` to the JS runloop
  (never run the map mutation inline), and `getCachedPointer` treats a null
  cached `napi_ref` as a stale entry (purge + miss). `patches/libjsc.patch`
  additionally no-ops `js_delete_reference` on a null ref at the leaf.
- **Removal condition**: upstream pointer-cache lifecycle that never mutates
  the map during a bridged call, or moves all erase operations off the
  finalizer path.

## Foreign-queue JS callbacks starved until the env loop pump (first-party, fixed)

The starvation observed 2026-11-01 (gif probes under `research/gif-runtime/`)
was **not an upstream limitation** — it was a first-party host gap, confirmed
and fixed 2026-11-02:

- `host.m` created `env->loop` (`uv_loop_init` → `js_create_platform` →
  `js_create_env`) but entered `[NSApp run]` without ever calling `uv_run`,
  and **every** handle on the loop is unref'd (the napi backend unrefs each
  block TSFN, libjs unrefs the env's prepare/check/teardown handles, libuv
  unrefs `wq_async`), so even a naive `uv_run(NOWAIT)` was a no-op
  (`uv_loop_alive` == 0).
- The fix in `host.m` keeps one ref'd `uv_async_t` sentinel so the loop is
  alive, and pumps `uv_run(UV_RUN_NOWAIT)` from the main run loop: a CFSocket
  on `uv_backend_fd` wakes it when foreign threads post TSFN work, a run loop
  timer armed to `uv_backend_timeout` covers pending uv timers (delayed libjs
  tasks), and a before-waiting observer covers loop state mutated by run
  loop-side JS. A `pumping` flag skips reentrant `uv_run` from callbacks that
  spin nested run loops; teardown invalidates the sources, destroys
  env/platform, closes the sentinel, and drains before `uv_loop_close`.
- Runtime-verified (probe `research/jsc-loop-probe/` + maintained test
  `packages/cli/test/macos-event-loop.test.mjs`): serial `NSOperationQueue`
  ops deliver and unwedge, `dispatch_async` global-queue blocks deliver, and
  `NSURLSession.dataTaskWithURL` completion blocks deliver real responses
  (HTTP 200). Delivery runs JS on the main thread and fires in
  `kCFRunLoopCommonModes`, matching the upstream `CFRunLoopPerformBlock`
  delivery path used by the `ENABLE_JS_RUNTIME` sibling.

Still **not** delivered (distinct upstream questions, not loop starvation):

- `Worker` remains `undefined` — embedder capability boundary
  (`RuntimeModules::Init` never runs in this host), unaffected by the pump.

The gif retention reason (starved `NSURLSession` completions) is removed;
requalify the TS port's remote HTTP(S) path separately.

## Foreign-thread method/function IMPs (upstream, patched)

`JSMethodCallback` and `JSFunctionCallback` in `ffi/napi/Closure.mm` invoked
napi directly on whatever thread ran the ffi closure — upstream defect
[NativeScript/runtimes#108](https://github.com/NativeScript/runtimes/issues/108).
Any JS-implemented ObjC method or C-function-pointer callback Apple delivers
off-main (`NSThread` selector invocations, spawned-thread delegate methods like
`NSPrintOperation.didRun`, background-queue protocol callbacks) dereferenced
the single-threaded env and crashed in `ObjCBridgeState::getObject`.
`JSBlockCallback` in the same file already marshalled foreign calls (and the
jsi backend marshals all of them); the method/function napi paths did not.

- **Workaround**: `patches/nativescript-runtimes.patch` routes both entries
  through `marshalCallbackToJSThread`: inline when the caller is `jsThreadId`
  (or a Hermes native-caller-thread case), otherwise
  `CFRunLoopPerformBlock(jsRunLoop, kCFRunLoopCommonModes)` +
  `dispatch_semaphore_wait` — the same mechanism the `ENABLE_JS_RUNTIME` block
  branch uses, so generic-napi embedders need no `env->loop` servicing and
  delivery fires inside nested modal run loops. The invoking ObjC frame parks
  until `ret` is filled, so IMP return semantics (including the NSError
  out-param special case) are unchanged; a dead bridge state returns a zeroed
  `ret` instead of parking on a run loop that will never run. Runtime-verified
  2026-11-02 on the rebuilt prebuilt: `macos-foreign-imp.test.mjs` — detached
  `NSThread` IMPs deliver, an `NSInvocationOperation` synchronous `id` return
  crosses the boundary, a marshal posted mid-delivery queues, and the process
  survives where it previously segfaulted. The `JSFunctionCallback` branch
  shares the same code path but had no runtime reproducer.
- **Remaining exposure (matches upstream)**: a foreign invocation that needs
  the JS thread while the JS thread hard-blocks on that same thread deadlocks
  (`performSelectorOnThread…waitUntilDone:YES` parks without spinning the run
  loop) — identical to the jsi backend's `dispatch_sync` and the TSFN block
  path's parked `ctx.cv`.
- **Removal condition**: upstream marshalling for `JSMethodCallback`/
  `JSFunctionCallback` in the napi backend; recheck after a runtimes pin bump.

## Incoming ObjC blocks bridged without ownership (upstream, patched)

`FunctionPointer::wrap` and `wrapWithEncoding` in `ffi/napi/Block.mm` stored
the raw `NSBlock*` of an incoming ObjC block and never copied it — upstream
defect
[NativeScript/runtimes#111](https://github.com/NativeScript/runtimes/issues/111).
The ObjC caller owns the block only for the delegate call: a heap block dies
with the caller's last release, a stack block dies with the callee frame, so
a JS-held wrapper looks callable indefinitely but its async invoke
dereferences a dead `block->invoke` — nondeterministic silent non-firing or
SIGBUS/SIGSEGV in `ffi_call`. Both incoming paths shared the gap:
metadata-declared `@?` params (`BlockTypeConv::toJS`, e.g.
`WKNavigationDelegate` via `protocols:`) and untyped `id` params whose value
is a block (`isObjCBlockObject` → `wrapWithEncoding`, the `exposedMethods`
shape). The jsi backend has the identical gap but is not the shipped backend
(`NS_FFI_BACKEND=napi`).

- **Workaround**: `patches/nativescript-runtimes.patch` `_Block_copy`s the
  incoming block inside both wrap sites when `isBlock` is set — a stack
  block promotes to a new heap pointer, so the wrapper stores and exposes
  the copy (`ref->function`, `napi_wrap`, `__ns_native_ptr`), never the
  incoming pointer — flags it `ownsBlock`, and `_Block_release`s exactly
  once in `finalizeFunctionPointerNow`. The `getCachedBlockJsFunction`
  identity lookup still runs on the original pointer first, so a
  JS-registered block round-tripping back into JS resolves to the original
  JS function without copying. The `isBlock=false` C-function-pointer
  branches are untouched. Runtime-verified 2026-11-02 on the rebuilt
  prebuilt: `macos-block-lifetime.test.mjs` — freed heap and clobbered
  stack blocks on both paths fire on async invoke where the stock
  framework died (SIGBUS exit 138 / SIGSEGV exit 139). Probe harness:
  `research/block-lifetime-probe/`.
- **App-side retains**: `web-browser`'s `copyBlock`/`_Block_release` pairs
  stay correct — `__ns_native_ptr` now resolves to the wrapper's owned copy,
  so its extra retain is a balanced no-op guard rather than load-bearing.
- **Removal condition**: upstream ownership for incoming blocks in
  `wrap`/`wrapWithEncoding` (and the jsi backend if it ever ships); recheck
  after a runtimes pin bump.

Scope boundary (runtime-verified 2026-11-01, `packages/video` migration,
unchanged by the pump): `AVPlayer`/`AVPlayerItem` remote HTTP(S) loading runs
entirely inside AVFoundation — no JS-involved session exists — so
`setTimeout`, main-queue `NSNotificationCenter` blocks, and
`seekToTimeToleranceBeforeToleranceAfterCompletionHandler` all completed even
while the loop starved (`tests/verify-macos.mjs` under
`test:macos-runtime`). A native pipeline whose callbacks only ever fire on
the main runloop remains a safe TypeScript port.

## Callable ObjC blocks in JS delegates need protocol-metadata signatures

Runtime-verified 2026-11-01 (richtext WKWebView channel probe): an
`exposedMethods` parameter can only encode `@` — blocks arriving through it
marshal as opaque, non-callable `CallbackObject` wrappers (WebKit decision
handlers carry no `_Block_signature`). Omit `exposedMethods` for protocol
methods and name members with the jsified selector spelling
(`webViewDecidePolicyForNavigationActionDecisionHandler`); the bridge then
resolves the signature from protocol metadata, and the block arrives as a
callable JS function. Omitting the method entirely is not an option:
unexposed members are never registered, and WebKit invokes required
`WKScriptMessageHandler` methods unguarded → `unrecognized selector` abort.

State cannot be keyed by `interop.handleof(this)` inside delegate callbacks —
the bridge may deliver a different wrapper for the same native receiver. Key
state by a created-and-held native argument instead (e.g. `message.webView`),
whose wrapper identity is stable — same shape as the embedded webview's
`states` WeakMap.

Scope boundary (runtime-probed 2026-11-02, media-converter feasibility,
`research/media-converter-runtime/`): the marshalling surface needed for a
TypeScript GIF→MP4 engine is complete on the main queue — `CGImageSource*`
decode and property dictionaries (`objectForKey` + `kCGImageProperty*` keys),
`AVAssetWriter`/`AVAssetWriterInput`/`AVAssetWriterInputPixelBufferAdaptor`,
`interop.Reference` out-params for `CVPixelBufferPoolCreatePixelBuffer`,
`CVPixelBufferGetBaseAddress` → `CGBitmapContextCreate` raw-pointer
round-trip, `CMTimeMake`/`appendPixelBufferWithPresentationTime`, and
dict-literal output settings all marshal. The 2026-11-02 env loop pump now
delivers `dispatch_async(dispatch_get_global_queue(…), block)` and custom
`NSOperationQueue.addOperationWithBlock` JS blocks on the main thread
(runtime-verified); `AVAssetWriter.finishWritingWithCompletionHandler` was
not re-probed but rides the same TSFN lane. The engine still cannot move to
TypeScript on this host: `Worker` is undefined, so there is no background
JS execution channel — the frame loop and H.264 backpressure would have to
run on the main queue, which cannot preserve nonblocking UI.
`dispatch_get_main_queue` and `dispatch_semaphore_create` are also absent
from metadata.
## Phantom metadata members and selector dispatch (upstream, patched)

Upstream metagen can borrow a derived class's accessors for a superclass
member: `processDerivedClassRefs` runs `convertMethodToPropertyIfNeeded`
backwards, rewriting an ancestor's method record into a property that uses
the subclass's getter/setter selectors. In `metadata.macos.arm64.nsmd` (pin
`5b697b39`) this produced `NSView.autoscroll`/`NSClipView.autoscroll` with
`NSMatrix`'s `isAutoscroll`/`setAutoscroll:` — part of a census of 213
phantom getters and 212 phantom setters (V8-feasibility audit, Zora).

- **Observed**: `NSView.alloc().init().autoscroll` on the stock prebuilt
  host aborts the process — `___forwarding___` →
  `doesNotRecognizeSelector:` → `objc_exception_throw`, and the NSException
  cannot unwind through `ffi_call`'s frames (`failed_throw` → SIGABRT), so
  the `@try/@catch` in `objcNativeCall` and any JS `try/catch` never run.
  Reproduced on `main` via `packages/cli/test/macos-bridge-selectors.test.mjs`
  (the test skips while the committed prebuilt predates the rebuilt binary).
- **Workaround**: `patches/nativescript-runtimes.patch` checks
  `respondsToSelector:` before every `self`-targeted selector dispatch in
  `ClassMember.mm` (`tryObjCNapiDispatch` generated invokers and
  `objcNativeCall` ffi/super paths — exactly one check per call) and
  rethrows `-[Class sel]: unrecognized selector sent to instance` as a JS
  error. The upstream jsi backend already guards identically
  (`NativeApiJsiInvocation.h` `callObjCSelector`). Receivers that implement
  a message only through `forwardInvocation:` while returning `NO` from
  `respondsToSelector:` now get a JS error instead of the forward — the
  jsi backend made the same tradeoff; `resolveInstanceMethod:` receivers
  still work because the check triggers resolution.
- **Alternative not taken**: regenerating metadata would drop the phantom
  members, but 425 synthesized entries plus optional-protocol/SDK drift
  make the dispatch guard the robust fix regardless; the metagen reversal
  itself is unpatched upstream.
- **Removal condition**: an upstream napi-backend dispatch guard or a
  metagen fix for the reversed property synthesis; recheck after a runtimes
  pin bump.

## Other verified host quirks

Recorded where they were found rather than repeated here:

- Only enumerable prototype methods register on `NativeClass` subclasses —
  use an enumerable-methods helper (the renderer's `registerGestureClass`)
  or `NSObject.extend(members, { protocols, exposedMethods })`. Verified by
  the ws delegate and `TabDelegate`.
- Node builtins resolve only through the shim `require` whitelist
  (`node:crypto`/`node:fs`/`node:os`/`node:path`); see the memory note
  `thea-jsc-host-fs-bridge` for `NSData`-only write semantics.
- `new interop.Pointer` is not re-entrant as a destructor arg, and
  exceptions thrown mid-job-drain are swallowed — see
  [SQLite notes](sqlite-notes.md).
- Exceptions need `NSApplication.sharedApplication` materialized before
  `setTimeout` callbacks fire — see the thumbhash memory note.
- `NSObject.extend` members declared in `protocols` (jsified names, no
  `exposedMethods`) receive protocol-metadata signatures: WebKit
  `completionHandler` params arrive as callable `FunctionPointer`s while
  `id`-typed params arrive as opaque `CallbackObject`s. The FunctionPointer
  invoke path only works while its underlying `NSBlock` lives — the bridge
  does not retain incoming blocks, so async WKUIDelegate handlers
  (alert/confirm/prompt/openPanel) die when the delegate returns and
  WebKit's `CompletionHandlerCallChecker` aborts "was not called". Hold the
  handler via `_Block_copy(handler.__ns_native_ptr)` and `_Block_release`
  after delivery; `web-browser`'s `in-app-browser.macos.ts` verifies it.
