# Open questions

> Seams we _expect_ to tear but haven't verified. Ordered roughly by "how badly
> does this hurt if wrong." Resolve by experiment or upstream reading, then move
> to decisions.md or the relevant doc.
>
> **Status legend** — ✅ answered (source- or lab-verified; evidence in
> prior-art/ or the domain docs' `Lab` notes), 🟡 partially lab-observed,
> 🔬 desk-answered pending lab confirmation, ⏳ still open.

## Blocking (answer before/while prototyping)

1. ✅ **Does the renderer include glob cover `.tsrx`?** — **Yes.** Rules are
   arbitrary filename globs matched by `resolveRendererForFile`; no extension
   check. `nativeScriptRenderers({ include: 'src/**/*.{tsx,tsrx}' })` covers
   both. (`octane/src/compiler/renderers.js`, `nativescript-octane/config.ts`.)
   Bonus: `.tsrx` files are Octane-owned _by extension_ — no pragma needed.
2. ✅ **Export delta `octane` vs `octane/universal/native`.** — Enumerated:
   universal-core exports the full hook set, `memo`, `lazy`, `use`, `useContext`,
   `createContext` (native variant), `createPortal` (capability-gated),
   `Activity`, transitions, `createUniversalRoot`, `createObjectDriver`.
   Absent: `Suspense`, `ErrorBoundary`, `Fragment` components (use
   `@try`/`@pending`/`@catch`), `createRoot`, `ViewTransition`, resource hints,
   DOM utilities. Full list: prior-art/octane.md → "universal export surface".
3. ✅ **NS ListView item templates vs Octane's reconciler.** — Answered on
   device (iOS sim): ListView recycles via `itemLoading`/`itemTemplate`;
   per-cell `ContentView` hosts each get an Octane root re-bound by
   `itemLoading`. **Now driver-owned** — upstream shipped our issue #1 as
   [#7](https://github.com/nativescript-community/octane/pull/8) in 0.2.1:
   `renderItem` on `<listview>` vends hosts, binds `items[index]` with an
   identity skip, re-binds live cells on `renderItem` change, unmounts on
   release. The leaf's module-scope maps + template machinery are deleted;
   only `renderEmpty` and the memo-on-`items` guard remain. Open follow-up:
   scroll-range recycling (only ~5 visible cells tested), Android parity.
4. ✅ **Controlled text inputs.** — Verified with **real keyboard input** on
   the iOS sim (idb `ui text` through the actual RTI input session):
   per-keystroke `textChange` → `onChange` → `set` → controlled `text=`
   write accumulates correctly (`helloa` → `helloab` → `helloabc`) and the
   selection survives each write-back — no reversion, no cursor reset to
   start. Earlier synthetic coverage (`view.notify` textChange) plus:
   (a) **programmatic `text` writes echo back as `textChange`** → each write
   produced a spurious `onChange`. **Fixed in the driver** — our report became
   upstream #5, shipped in 0.2.1 (per-node `muted` set during the driver's own
   prop write). Verified: one synthetic `textChange` → exactly one `onChange`,
   and the self-test's `setText('hello')` no longer echoes.
   (b) The driver's same-value guard (`view[name] === value → skip`) already
   prevents redundant writes on the state→native path.
   (c) **`undefined` prop writes coerced native defaults** — omitted
   `editable` became `userInteractionEnabled=NO`, a dead field that rendered
   normally in the AX tree. Driver `setProp` now skips `undefined` (decision
   #40). Still open: IME marked-text composition (only ASCII typed) and
   Android parity — the higher-risk platform for setText cursor reset.
5. ✅ **Resolver ordering vs renderer scoping.** — Resolution and compilation
   are decoupled: the octane plugin compiles by **resolved filename** at
   transform time; its `resolveId` only claims virtual/adapter ids. Our suffix
   resolution (via `resolve.extensions` ordering or a `resolveId` plugin)
   completes first; the rule glob sees `Foo.native.tsrx` and assigns the
   nativescript renderer. No ordering hazard. (vite-plugin `src/index.js` +
   `compiler/bundler.js`.)

## Significant

6. ✅ **Suspense/`use()` on universal.** — `use()` and `lazy()` are exported;
   async boundaries exist as `@try`/`@pending`/`@catch` (lowered to
   `universalTry`; internal `UniversalSuspense`/`canHandleSuspense` machinery).
   **No `<Suspense>` component on universal** — shared async boundaries are
   `.tsrx` `@try` blocks. DOM `Suspense` remains for web-only files.
7. ✅ **Portals on native?** — ABI supports them (`UniversalPortalValue`,
   `UniversalPortalCapability`, portal plan values), but the NS driver does
   not implement the capability (`resolveParent`: non-numeric parent → root).
   Overlay path = RootLayout imperative bridge (see primitives.md).
8. ✅ **NS CSS `transition` property.** — **Not supported.** Animations are
   `@keyframes`/`animation-*` only, and only ~12 properties animate (opacity,
   translate/scale/rotate, width/height, background-color, perspective +
   transform). No `transition`, no `animation-play-state`, `direction` accepts
   only `reverse`. → Simple state animations need the JS facade or class+keyframe.
   (ns-css-keyframes skill, verified vs core 9.1.)
9. ✅ **`className` clsx composition on native.** — Composition is upstream of
   the driver: compiler lowers analyzable class arrays to string concat;
   runtime composes the rest. Driver receives a string → `view.className =
String(value)`. Caveat: NS className-swap can leave stale backgrounds —
   our leaf/driver may need the `''`-then-set workaround (note in styling.md).
10. ✅ **`style` object semantics.** — Verified in `setProp`: string →
    `setInlineStyle` (CSS declaration parse); object → `Object.assign(
view.style, v)` — camelCase `Style` keys, **dip units**. Shared `style`
    objects are therefore dip-denominated; web leaf maps dip→px 1:1.
11. ✅ **CSS selector coverage.** — Supported: type (incl. `stack-layout`
    dashed forms), `.class`, `#id`, `>`/descendant, `:not`/`:is`/`:where`
    (zero-specificity), `:pressed`, `:hovered`, nestable `@media`, attribute
    selectors (all operators, matching arbitrary view props). Unverified:
    `!important`, `z-index`, sibling combinators. Traps: bare `[attr]` matches
    nothing; per-declaration error recovery hides broken values.
    (ns-css-selectors skill.)
12. 🟡 **Two dev servers on one tree.** — Partially lab-observed: concurrent
    `ns build ios` runs collide on the shared Xcode DerivedData
    (`build.db` locked → exit 65) — serialize builds or isolate DerivedData
    per invocation. `vite dev` vs `ns debug` watcher contention over `.tsrx`
    writes remains unmeasured.
13. ✅ **Multiple renderers in one config.** — Yes: `registry` map + ordered
    `rules` (first match) + `boundaries` (per-export cross-renderer props,
    e.g. `{ownerRenderer:'dom', childRenderer:'universal', prop:'children'}` —
    renderer islands, the `@octanejs/three` mechanism). We stay two-config;
    boundaries is the seam if we ever embed native islands in web or
    DOM-compiled content in `webview`/`htmlview`.

## Later / finer

14. ✅ **HMR accept shape.** — Named and default exports both register (keyed
    `default` vs name in `hot.data.__octaneComponents`); modules are
    self-accepting via `hmrUniversalComponent` wrapper; first-evaluation
    callback stays the anchor. Named-exports convention remains hygiene for
    non-component exports, not a hard requirement.
15. ✅→🟡 **A11y prop parity** — `accessible`/`accessibilityLabel`/
    `accessibilityRole` verified reaching the native view via generic
    `setProp` (iOS sim readback). Web leaf maps the same shared props to
    `role`/`aria-label`/`aria-hidden`. Still open: precise Role-union
    mapping (NS role names ≠ ARIA 1:1 — `accessibilityHint/Value/State/
LiveRegion` unwired in leaves so far).
16. ✅ **`@for` keys → native identity.** — Lab-verified (iOS sim): a keyed
    `@for` over `{id,label}` items on a flexboxlayout renders and reorders
    correctly through `insert`/`move` commands — all five rows present in
    the tree post-shuffle with no anomalies. On `listview`, identity stays
    data-level (recycling).
17. ✅ **Bundle impact of platform modules** — Verified: the web bundle has
    zero `nativescript`/intrinsic/`itemLoading` references (283 kB, gzip
    83 kB); the native vendor carries no DOM runtime (`dom-bindings`/
    `hydration`/`server-rpc` absent — the only `document.` hit is NS core's
    own WKUserScript webview code).
18. ⏳ **Fonts**: `font-family` token → registered font name on iOS vs Android
    vs web — a small but certain mapping table to own.
19. ✅ **`getCssVariable` timing + theme into modal windows** — Lab-verified
    (iOS sim): `view.style.getCssVariable('--color-primary')` resolves
    (`"#4f46e5"`), and the theme class boundary is confirmed —
    **`ns-dark` does not cross the modal root** (second Octane root on a
    separate ContentView host). Modal/sheet surfaces must apply the scheme
    class themselves or subscribe to `systemAppearanceChanged`.
20. ✅ **SSR DOM assumptions in shared output.** — Not an issue by
    construction: universal renderers are `server: 'unsupported'`; SSR only
    ever runs on DOM-compiled output (shared files compiled under `dom` for
    web). The DOM build's SSR output is DOM-correct; the native build never
    sees it.
21. ⏳ **Route-file config vocabulary** — pin before apps accumulate route
    files. Proposed (desk-sketched from the TanStack Start comparison):
    exports carry behavior (`loader`, `beforeLoad`, `head`), `+suffixes`
    carry presentation/render mode (`+modal`, `+fade`, `+ssr`), `RouteMeta`
    fields carry what platforms read. Feature items parked in
    navigation-notes.md → "Route config surface"; Silo `route-config-surface`.
22. ⏳ **SVG fidelity on native (`svgview` / ui-svg).** — Src grammar verified
    at source: `res://`/`~/`/file paths, `File`/`ImageAsset`, inline markup
    strings, and promise srcs (remote `.svg` URLs fetch→markup). Unverified
    on device: `currentColor`/root-`color` tint resolution, divergence
    between SVGKit (iOS) and androidsvg (Android) on gradients/filters/
    `<text>`, `stretch`/auto-sizing parity with `<image>`, and svg-as-`src`
    in `Icon` glyphs.
23. ✅ **JSX element props on universal targets** — Resolved: the consumed
    pack carries the lowering (octane-universal-signals `eaa51b09`,
    upstream octanejs/octane#1311) — prop JSX emits `universalValue`,
    verified in the iOS bundle and via the drawer sweep assert. Published
    octane@0.5.0 alone still rejects native signal reads, so the dist-pack
    override stays until a release ships both.
24. ⏳ **Squircle corners on Android.** — `cornerShape` is parsed but the
    Android background path (`org.nativescript.widgets.BorderDrawable`,
    `Path.addRoundRect`) ignores it. Real support needs either a superellipse
    path in ui-mobile-base's Java drawable (AAR rebuild — heavy) or a
    TS-level `android.graphics.drawable.Drawable` subclass plus
    `setClipToOutline` (path outlines need API 33+ for child clipping).
    Parked: Android platform convention is round corners; revisit if a real
    app wants parity.
