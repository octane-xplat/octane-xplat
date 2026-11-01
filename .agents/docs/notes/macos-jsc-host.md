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

## JS callback delivery is main-queue-only and starves under in-flight transfers (upstream)

Runtime-verified on the prebuilt arm64 host 2026-11-01 (gif probes under
`research/gif-runtime/`):

- JS blocks are only invoked on the main queue. `dispatch_async` on global
  queues, custom `NSOperationQueue`s, and `NSURLSession` completion handlers
  on default/delegate queues never deliver; several crash the host.
- `NSURLSession` task **completion blocks never deliver at all** — the task
  resumes and the request reaches the server, but no JS callback arrives.
  `NSURLConnection`'s block API fails the same way. A JS
  `NSURLSessionDataDelegate` on `NSOperationQueue.mainQueue` does dispatch.
- Even main-queue delivery is unreliable while a remote transfer is in
  flight: JS callbacks registered from outside a callback context can be
  dropped. A `mainQueue.addOperationWithBlock` op that re-arms itself from
  inside its own op keeps being delivered.
- Only enumerable prototype members register as ObjC methods on a JS
  `NativeClass` delegate, so the prototype must be re-defined enumerable
  before `NativeClass(this)` — same constraint as "Other verified host
  quirks" below.

Consequence: a TypeScript port of `XplatAnimatedImageView` could drive its
view/layout/animation surface but could not reliably complete remote
HTTP(S) image loads — the only JS-reachable delivery channel starves
in-flight. The package keeps the Swift `URLSession` data-task pipeline
(native completion handlers don't cross the bridge). Revisit if upstream
delivers non-main-queue or block-based callbacks reliably; recheck after a
runtimes pin bump.

Scope boundary (runtime-verified 2026-11-01, `packages/video` migration):
the starvation applies to transfers the JS side is involved in delivering
(bridged `NSURLSession`). `AVPlayer`/`AVPlayerItem` remote HTTP(S) loading
runs entirely inside AVFoundation — no JS-involved session exists — so
`setTimeout` keeps firing (observed ~70% rate, never stalled), main-queue
`NSNotificationCenter` blocks deliver, and
`seekToTimeToleranceBeforeToleranceAfterCompletionHandler` completes, all
while a drip-fed remote transfer is still in flight
(`tests/verify-macos.mjs` under `test:macos-runtime`). A native pipeline
whose callbacks only ever fire on the main runloop remains a safe TypeScript
port; do not generalize the gif finding to it.

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
