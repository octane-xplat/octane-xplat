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
