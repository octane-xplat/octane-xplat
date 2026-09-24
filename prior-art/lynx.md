# Lynx (lynxjs.org)

> ByteDance's cross-platform engine (TikTok at scale; iOS/Android/HarmonyOS/web,
> now desktop via Lynxtron). HTML-like element vocabulary + CSS subset rendered
> to native views; ReactLynx is React on a Preact core over a **dual-thread** JS
> runtime. The closest precedent to our stack in spirit — and it answers several
> of our questions the opposite way, which makes the contrasts the useful part.

## What it actually is

- ~19 built-in lowercase elements (`view`, `text`, `image`, `scroll-view`,
  `list`, `viewpager`, `overlay`, `frame`, `page`, `input`, `svg`, `webview`…)
  that map to `UIView`/`ViewGroup`/custom elements on web. Extension seam is
  *native code*: per-platform `LynxUI` impls behind one tag, or the XElement
  library. Divergence never happens in app TSX.
- ReactLynx: stock React API (`import { useState } from '@lynx-js/react'`), JSX
  uses the lowercase tags directly, no `document`/`window` — a `lynx.*` global
  namespace (`createSelectorQuery`, `getElementById`, `accessibilityAnnounce`,
  `getJSModule`) replaces it. Same as our invariant #4.
- Build: Rspeedy (Rspack) → `.lynx.bundle` containing the background-thread JS
  *and* main-thread bytecode + styles. Same source also emits a `.web.bundle`
  (every doc example renders itself on the page — same dogfood trick as
  `apps/docs`).

## The dual-thread tax — our strongest lesson in reverse

Lynx puts reconciliation, lifecycle, and all ordinary event handlers on a
**background** thread; the main (UI) thread owns the element tree, layout,
paint, and opt-in user scripts. Frame one renders on the main thread
synchronously while the background builds a parallel tree ("SSR hydration
between two JS runtimes" — their IFR story). Everything after that crosses a
JSON boundary.

The machinery this forces is the interesting part:

- `'main thread'` directive functions + `main-thread:bindtap`-style props +
  `useMainThreadRef` → `MainThread.Element.setStyleProperty` — a worklet island
  for gesture/scroll-synced work. Captured vars are JSON snapshots re-synced on
  re-render; cross-thread calls (`runOnMainThread`) are async.
- `'background only'` / `import 'background-only'` — compile-time marking with
  transitive rules for side-effect code.
- No `useLayoutEffect` — all lifecycle is async. Sync measurement goes through
  `main-thread:bindlayoutchange` or a main-thread ref.
- Two event-object types: plain JSON on background, operable `MainThread.Element`
  on main thread. Background node ops batch via `NodesRef.invoke().exec()`.

**For us:** NS already runs JS on the UI thread, so everything MTS exists to
recover — zero-latency gesture handlers, synchronous `view.animate` frames,
sync measurement — is free in our stack. Lynx's tax documents exactly what our
architecture saves. If there's a lesson to take, it's the *escape-hatch API
shape*: an imperative element handle reachable from an event handler
(`MainThread.Element`) is their `bind`-equivalent seam.

## Compiler-informed rendering ≈ Octane's universal plan

ReactLynx compiles JSX to a "Snapshot" IR: a static creator, indexed dynamic
updaters, dynamic child slots, and a template ID shared across instances — the
runtime never re-diffs static structure. This is the same architecture as
`universalPlan("nativescript")` + slot tables + create/update/insert/event
commands. Two systems converging on "compiler extracts the static host tree,
runtime diffs only slots" is independent validation of the Octane universal
ABI. Their extra trick — running the same render on two threads and diffing the
*results* — is what buys IFR; not portable to us.

## Event model

Propagation phase and interception are encoded in the **attribute name**:
`bind*` (bubble), `catch*` (bubble + stop), `capture-bind*`, `capture-catch*`,
`global-bind*` (cross-component). `e.stopPropagation()` exists only inside
MTS. Contrast with ours: RN-style `onPress`/gesture props + real DOM semantics
on web. Their scheme is declarative propagation control without method calls —
worth remembering if we ever need capture-phase or "stop here" gesture props,
and `global-bind` is a neat primitive for app-wide listeners.

## Styling

Real CSS — selectors, cascade, `class`/`style` attrs, custom properties,
media queries (subset), transitions/`@keyframes`, WAAPI-ish `lynx.animate` —
plus quirks: `box-sizing: border-box` always, no margin collapse, no inline
display (text lives only in `<text>`), `display` ∈ `linear` (default,
Android-LinearLayout-inspired) / `flex` / `grid` (subset) / `relative` /
`none`, non-custom properties don't inherit unless opted in, `-x-`-prefixed
engine extensions, `rpx` responsive units. Same "CSS subset + custom props +
vendor prefix" posture as NS — their `-x-` namespace is a tidy convention for
nonstandard props (our equivalent is platform prop bags).

## Platform divergence: the opposite mechanism

No file suffixes. `SystemInfo.platform` is a *runtime* value; the compile-time
macros (`__MAIN_THREAD__`, `__BACKGROUND__`, `__LEPUS__`, `__DEV__`) split by
**thread/runtime**, not OS. Divergence is pushed into native code behind the
element/NativeModule boundary — viable for them because leaves are
Swift/Kotlin. Ours are TSX, so `.web`/`.native` file splits remain the right
call — but the shared invariant is identical: one vocabulary per file,
divergence behind the boundary.

## Other notes worth stealing

- `<list>` realizes child UI lazily: `useEffect`/`ref` fire on JS-instance
  creation; only `main-thread:ref` tracks actual UI mount/recycle. Same split
  we hit with NS `itemLoading` refiring — instance lifecycle ≠ view lifecycle
  in recycled lists. Data-driven `items`+`renderItem` is the right contract.
- No built-in router — recipes for react-router/tanstack-router only. Lynx is
  an embedded *surface* (host owns navigation via `LynxView`); our nav layer is
  more integrated than anything they ship.
- `<scroll-view>` is explicit — no `overflow:scroll` on any element; scrolling
  is opt-in per element. Matches our `ScrollView` primitive honestly rather
  than pretending CSS overflow exists.
- Ecosystem gap answer: `lynx-ui` component kit + Luna tokens + motion libs +
  testing-library — they grew the same package set we specced (`@octane-xplat/ui`,
  platform services, testing).

## What doesn't transfer

- MTS plumbing (directives, JSON-capture islands, `main-thread:` attrs, dual
  event objects) — our JS already runs where the pixels are.
- Dual-runtime IFR — single runtime for us.
- Native custom elements as the extension seam — our leaves are JS/TSX.
- Mini-program event naming (`bind`/`catch`/`capture-`) — we chose RN/DOM
  normalization.
- Element-level divergence-free promise — they can promise it because they own
  the engine; we inherit NS's per-platform quirks, so our honest version is
  "one vocabulary, divergent leaves."

## Sources

- https://lynxjs.org/next/react/introduction.md — ReactLynx overview
- https://lynxjs.org/next/react/thinking-in-reactlynx.md — dual-thread rules
- https://lynxjs.org/next/react/main-thread-script.md — MTS
- https://lynxjs.org/next/react/compiler-informed-rendering.md — Snapshot IR
- https://lynxjs.org/next/react/lifecycle.md — lifecycle under dual threads
- https://lynxjs.org/next/guide/ui/elements-components.md — element vocabulary
- https://lynxjs.org/next/guide/interaction/event-handling/event-propagation.md
- https://lynxjs.org/next/guide/ui/styling.md + layout/index.md — CSS subset
- https://lynxjs.org/next/guide/interaction/ifr.md — instant first frame
- https://lynxjs.org/next/api/index.html — full API index
