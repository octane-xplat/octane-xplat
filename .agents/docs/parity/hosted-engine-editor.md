# Hosted-engine editor device evidence

Runtime evidence for the Foxtrot editor-architecture question: can the shared
`WebView` leaf host the app's own document engine — a real ProseMirror
`EditorView` with a Foxtrot-shaped recursive schema — driven across a
native↔page bridge on iOS and Android?

Evidence type: `lab-experiment`. Run 2026-10-08 on macOS arm64, worktree on
`main` at `6ed96e91`.

## What ran

Probe cases under `research/hosted-engine/` (temporary, gitignored):
`hosted.tsrx` mounts `<WebView html=…>` with a self-contained document whose
bundled script installs a real `EditorView` over a `toggleItem` schema (block
nodes with `taskId`/`state`/`priority`/`createdAt` attrs, recursive `block+`
content) and exposes a `__probe` command API; `bridge-push.tsrx` isolates the
push-channel attempt. The native side drives `evaluateJavaScript` (iOS) /
`evaluateJavascript` (Android); page→native uses WKScriptMessageHandler (iOS) /
a bridge-scheme navigation intercepted by a JS-extended `WebViewClient`
(Android), with an in-page outbox drained via evaluate as fallback.

```sh
node research/hosted-engine/build-page.mjs   # regenerates editor-doc.ts
pnpm probe run research/hosted-engine/hosted.tsrx --target ios --device <UDID> --timeout 90000
pnpm probe run research/hosted-engine/hosted.tsrx --target android --device <SERIAL> --timeout 90000
```

| Target           | Device                                                                  | Result                                                                       | Run ID                                                                                    |
| ---------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| iOS              | iPhone 17e simulator, iOS 27.0 (`CF4A9D5B-C905-4EB3-A3CE-EB6BAF30FC4B`) | PASS — 19/19 assertions                                                      | `5d19f9fb-6a6a-4724-9a6d-999ac10faaac` (repeat of `2537bd5b-9377-4abf-a4be-09b1d573e220`) |
| Android          | `octane-prime-larkspur` AVD, API 35 arm64 (`emulator-5556`)             | PASS — 19/19 assertions                                                      | `b6ba0fc5-e81e-45c7-9fcd-50a97c65abe8`                                                    |
| iOS push channel | same simulator                                                          | host crash — `doesNotRecognizeSelector` at `WKScriptMessageHandler` dispatch | `bridge-push.tsrx` runs, see below                                                        |

Raw runner output: `.agents/docs/parity/evidence/hosted-engine-ios-2026-10-08.json`,
`.agents/docs/parity/evidence/hosted-engine-android-2026-10-08.json`.

## Findings

**A hosted real engine works on both phones.** The shared `WebView` leaf mounts
WKWebView / android.webkit.WebView, an inline bundled document loads cleanly,
and a real ProseMirror `EditorView` instantiates inside it. The 3-level
`toggleItem` fixture round-trips **losslessly** — every attribute and the
recursive structure survive `load`→`serialize`. This is precisely what the Aztec
surface cannot do (see `nested-tree-editor.md`: hidden-block markup, `<p>`
flattening, `<br>` drift, no node demote/promote).

**Document-level commands work.** `insertText` inside a nested node, `split` mid
text producing sibling `toggleItem`s, node-level `indent` (nest under previous
sibling) and `outdent` (restore to root), engine `undo`/`redo`, and the
`editable` toggle all behave correctly — i.e. the Foxtrot tree operations that
Aztec honestly refuses are ordinary ProseMirror transforms here.

**Bridge.** Native→page is proven on both targets via
`evaluateJavaScript`/`evaluateJavascript`. Page→native: Android push works — a
JS-extended `android.webkit.WebViewClient` intercepts `xplat-bridge://` iframe
navigations in `shouldOverrideUrlLoading`. iOS push is **not proven**: a
JS-defined `NSObject` subclass registered via
`WKUserContentController.addScriptMessageHandlerName` crashed the host process
with `doesNotRecognizeSelector` at message dispatch (three class shapes tried —
`ObjCClass` decorator applied and returned constructor used, `ObjCProtocols`
static, `ObjCExposedMethods` static; `NativeClass` is not defined in the eval'd
case context). The pull channel (page outbox + `evaluateJavaScript` drain) works
on iOS. A production iOS push channel should register the message handler in a
compiled facade — the `XplatAztecEditor.swift` Swift-facade precedent — rather
than JS-defined subclasses.

## Boundaries — what this does not prove

- Handler-level mechanism only: `evaluateJavaScript` calls and transaction
  dispatch. **No OS keyboard input, IME composition, selection handles, paste,
  scrolling interplay, or accessibility** — the real-input gates from the
  decision note remain.
- No Yjs/collaboration bytes, no live `Tiptap` editor object (ProseMirror core
  suffices as the capability proof — Tiptap is a wrapper over it).
- No bundle-size, memory, or latency budget measured; the document is inlined
  (~200KB fixture), not served as app assets with origin/session semantics.
- `EditorView` mount was asserted via the post-load `env()` check; the recorded
  `page env` measurement is the pre-load snapshot (`prosemirrorMounted: false`
  there is expected — `load()` creates the view).
