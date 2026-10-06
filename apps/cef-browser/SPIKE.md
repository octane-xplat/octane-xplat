# S0 SPIKE report — CEF child view inside an AppKit-rendered Xplat window

Date: 2026-10-06. CEF: `154.0.34+g14c5a08+chromium-154.0.8037.98`, macOS arm64
minimal distribution from `cef-builds.spotifycdn.com` (SHA-1
`b7081f6609e5edccf07be96b5d7977329fbe1bdf`, fetched by `scripts/fetch-cef.sh`).

## Verdict

**GO — the spine is proven at runtime, sandboxed, end to end.** An
AppKit-rendered Xplat window hosts a CEF browser as a real windowed child
NSView via the `attachTo` seam; an Xplat text field navigates it; CEF events
flow back into Xplat state; the external message pump coexists with the host
run loop; the renderer/network/storage helpers run under the V2 seatbelt.

## What was built

`apps/cef-browser` — a private workspace app proving the approved spine:

- An Xplat window rendered by the AppKit (native) renderer
  (`@octane-xplat/macos-renderer`, JavaScriptCore host).
- `XplatCefHost` (`platforms/macos/{include,src}`) — a native leaf that
  dlopens `Chromium Embedded Framework`, resolves the ~15 C C API entry
  points it needs, initializes CEF (Alloy), and attaches the browser as a
  windowed child NSView inside Xplat layout — same shape as
  `XplatEditorHost`/`XplatWebViewHost` (ref → NSView → `attachTo` →
  `installDispatcher` JSON packets).
- `XplatCefActionTarget` — a tiny real-ObjC target/action shim (see
  "renderer defect found" below) used to wire the chrome controls.
- `cef_helper_main.m` — one helper executable copied into all five helper
  bundles: `cef_sandbox_initialize` first (V2 seatbelt reads the serialized
  policy from the `--seatbelt-client` fd), then dlopens the framework +
  bundled `Libraries/*.dylib`, then `cef_execute_process`.
- `cef-runtime/XplatCefSpike.app` — assembled bundle:
  `Contents/Frameworks/` carries the CEF framework and the five helper
  bundles; `Contents/MacOS/XplatCefSpike` is the **JavaScriptCore host
  binary itself** (see sandbox notes — the browser process must be bundled).
  Built by `scripts/build-cef-runtime.sh`.

UI: back/forward/reload buttons, URL text field, Go button, status + title
labels, and a `flexGrow` flexboxlayout whose ref supplies the parent NSView.

## Runtime evidence (all with the renderer sandbox ON unless noted)

Captured from `/tmp/cef_final.log`-equivalent runs of `scripts/run.sh`:

- `cef initialized (sandbox=on)` → `{"type":"created"}` →
  `{"type":"resize","w":1024,"h":691}` → `nav https://example.com/` →
  `title "Example Domain"` → `isLoading:false`.
- Self-test navigates via the chrome: sets the field's `stringValue`, fires
  its target/action, `performClick` on Go → `nav https://example.org/` →
  `isLoading:false` with `canGoBack:true`.
- `requestSource` → `{"type":"source","len":1989,"head":"<!DOCTYPE
  html>...<title>Example Domain</title>..."}` — the live DOM of the loaded
  page, fetched through `cef_frame_t::get_source`.
- `injectWheel` issues `cef_browser_host_t::send_mouse_wheel_event` at the
  view center without error.
- `focus` events fire (`where:"content"`) when CEF's view takes first
  responder; returning first responder to the Xplat text field does not
  crash.
- Sandboxed subprocesses stay alive for minutes: 1 network-service utility
  (`--seatbelt-client=36`), 1 storage utility (`--seatbelt-client=49`), 3
  renderers (`--seatbelt-client=87`). Only recurring log line is a
  signature-validation warning (`-67030`) caused by ad-hoc signing.
- No-sandbox mode (`XPLAT_CEF_NO_SANDBOX=1`) works identically.

## Green-light checklist

| Criterion | Result |
|---|---|
| Page renders inside native layout | **Pass (evidence: real DOM via get_source + title/nav/load events).** Not pixel-verified — no screenshot capture was performed; the windowed NSView is attached and composited by CEF. |
| Page scrolls inside native layout | **Partial.** `send_mouse_wheel_event` is accepted without error; no scroll-offset readback exists for windowed mode, so the rendered scroll itself is unverified. |
| Page takes input | **Partial.** Real AppKit action dispatch into CEF navigation is proven (field action + performClick); OS-level key/mouse delivery into web content is not exercised end-to-end (injected CEF wheel events work). |
| Resize relays layout | **Pass.** `NSViewFrameDidChangeNotification` on the parent → `cef_browser_host_t::was_resized`; a `{"type":"resize",w,h}` packet is emitted (observed `1024x691`). The CEF view also tracks via `NSViewWidthSizable|HeightSizable`. |
| External pump coexists without stalls | **Pass.** `kCFRunLoopBeforeWaiting` observer (default mode) + one-shot timers from `on_schedule_message_pump_work`. Page loads complete; `on_schedule_message_pump_work` keeps scheduling while idle. See pump notes. |
| Focus moves cleanly chrome ↔ content | **Partial → likely pass.** `on_set_focus`/`on_got_focus`/`on_take_focus` fire both ways with the `focus` events emitted; `set_focus(1)` (chrome→content) works; content→chrome via `makeFirstResponder` does not crash, but no `focus` event was observed for that direction — needs an interactive check. |
| Renderer sandbox on | **Pass.** V2 seatbelt live on renderers + network + storage helpers. GPU runs in-process (`XPLAT_CEF_IN_PROCESS_GPU=1`) — the sandboxed GPU helper still dies (see sandbox notes). |

## Message pump

`external_message_pump=1`. What finally works:

- `CFRunLoopObserver` on `kCFRunLoopBeforeWaiting`, default mode →
  `cef_do_message_loop_work()` once per run-loop iteration before sleeping.
  Never fires inside nested AppKit event-tracking modes — that is what made
  the original free-running `NSTimer` (common modes) crash CEF.
- `on_schedule_message_pump_work(delay_ms)` → `dispatch_async` to main →
  coalesced one-shot `NSTimer` (immediate `do_work` for delay ≤ 0).

This satisfies CEF's documented contract (pump on schedule + never starve)
without over-driving. Note: the actual crash source was NOT the pump — see
below — so the simpler variant may also have worked; the observer form is
kept because it is provably nested-mode-safe.

## THE root cause of the crash weeks — C API refcounting

Every persistent crash (`EXC_ARM_DA_ALIGN` at garbage addresses inside CEF,
always on `CrBrowserMain`, always ~1 s after browser creation) traced to one
contract violation:

**`cef_client_t::get_*_handler` must return an add-ref'd pointer.** CEF
mirrors the C++ `CefRefPtr` convention: the caller owns one ref on the
returned handler and releases it when done. My getters returned the raw
handler without `add_ref`, so each get/wrap/release cycle drove the handler
refcount *negative* (`[ref-] 22_cef_display_handler_t -8 -> -9`). When a
handler hit zero the code deleted the whole handler bundle — while CEF kept
invoking cached pointers into it → use-after-free → wild calls →
`EXC_ARM_DA_ALIGN`.

Fix: each `get_*_handler` now does `out->base.add_ref(&out->base)` before
returning. Refcounts balance (verified with `XPLAT_CEF_REFTRACE=1`: zero
underflows) and every crash disappeared immediately — same binary, same
flags. **This is the single most important finding for BrowserSurface's
native leaf.**

## Renderer defect found (blocks all Xplat chrome actions)

The macOS renderer's control dispatch is broken in this NativeScript
runtime: `ButtonActionTarget` registers `controlChanged`/`buttonPressed`/
`viewPressed`/... via `static ObjCExposedMethods`, but those never become
real ObjC methods (`respondsToSelector:` is false for them — delegate
methods work only because `ObjCProtocols` drives `forwardInvocation`).
`sendAction:`/`performSelector:` do `methodForSelector` → miss →
`doesNotRecognizeSelector` → `__retain_OA` → SIGTRAP. **Every button press /
text-field commit / gesture / slider / picker action crashes** — latent,
not CEF-specific. Reproduced standalone in the JSC host.

Also: the action strings lack colons (`'controlChanged'` vs the exposed
`controlChanged:`) — secondary, masked by the first problem.

Workaround used here: `XplatCefActionTarget` (real ObjC, in the leaf)
provides `xplatAction:`; `wireControl` repoints `control.target`/`action`
ObjC-side (assigning a `SEL` through the JS bridge also crashes — the bridge
retains it as `id`). A real fix belongs in `packages/macos-renderer`
(native target class or a supported exposure mechanism).

## Sandbox notes (V2 seatbelt)

- Browser process **must be bundled**: the serialized seatbelt policy is
  parameterized on the main bundle; an unbundled browser produces a policy
  that blocks helper `dlopen`s ("file system sandbox blocked open()").
  `build-cef-runtime.sh` now copies the JSC host binary into
  `Contents/MacOS/XplatCefSpike`.
- Helpers must call `cef_sandbox_initialize` BEFORE loading the framework
  (CEF docs, M138+ V2 sandbox), then dlopen framework + `Libraries/*.dylib`.
- `--lang=` is required on helper command lines (`Check failed:
  command_line.HasSwitch(switches::kLang)`); provided via argv AND
  `settings.locale`.
- The sandboxed GPU helper still dies inside `cef_execute_process`
  (`SIGTRAP`, Chromium CHECK — the `GPU process isn't usable. Goodbye.`
  FATAL is avoided by `XPLAT_CEF_IN_PROCESS_GPU=1`, i.e. `--in-process-gpu`,
  which keeps compositing in the unsandboxed browser process).
- One remaining warning: `Unable to derive validation category for current
  process ... -67030` — expected: the ad-hoc-signed binary fails
  code-signature peer validation; logging only, rendezvous still works.

## Other traps worth recording

- `cef_api_hash(CEF_API_VERSION, 0)` must precede `cef_initialize` — the raw
  C API's lazily-populated version table otherwise yields
  `CefApp_0_CToCpp called with invalid version -1`.
- `CEF_API_VERSION=15400` is pinned via `xplat.macos.defines`.
- `cef_settings_t` alone cannot teach an unbundled host the framework/ICU
  layout — the framework's bundle lookups run before settings apply. Path
  switches must go into `cef_main_args_t`: `--main-bundle-path`,
  `--framework-dir-path`, `--resources-dir-path`, `--locales-dir-path`,
  `--browser-subprocess-path`, `--root-cache-path`.
- `cef_execute_process` is reached only via `argv[1]=--type=...`; for the
  browser process it just returns −1.
- `attachTo` may see a zero-bounds parent (ref can fire before layout);
  fall back to `window.contentView.bounds`.
- JS event emission from CEF callbacks must be async (`dispatch_async` to
  the main queue) — re-entering JSC from inside a CEF callback is unsafe.
- `[cef-helper]` stderr flows to the browser's stderr — useful for helper
  bring-up debugging.
- `[macos-host] ignored text control prop flexGrow` — the macOS host
  ignores `flexGrow` on textfield (accepted limitation; the toolbar is
  fixed-height anyway).

## Not proven / open for S1

- Pixel-level render verification (no screenshots taken; evidence is
  DOM/events-level).
- Real OS scroll/key input into web content (CEF-level injection works;
  OS-level NSEvent delivery unverified).
- Content→chrome focus *event* (focus leaves CEF's view without crash; the
  `on_take_focus` event wasn't observed for that direction).
- Sandboxed GPU helper (works in-process; true GPU-process sandboxing
  blocked by an unexplained CHECK inside `cef_execute_process`).
- Long-run stability, memory, multiple browser instances, IME/marked text.
- Proper fix for the renderer's `ObjCExposedMethods` action dispatch
  (affects all controls, not just this app).
- Code-signed build to clear the `-67030` peer-validation warning.

## Files

- `platforms/macos/src/XplatCefHost.mm` — CEF bridge (~850 lines)
- `platforms/macos/include/XplatCefHost.h` — leaf interface
- `platforms/macos/helper/cef_helper_main.m` — shared helper executable
- `src/cef.macos.ts` — JS facade + `wireControl`
- `src/App.tsrx` — chrome UI + self-test
- `src/main.mjs`, `src/appkit.mjs` — entry + window
- `scripts/fetch-cef.sh`, `scripts/build-cef-runtime.sh`, `scripts/run.sh`
- `cef-dist/` (gitignored), `cef-runtime/` (gitignored)
