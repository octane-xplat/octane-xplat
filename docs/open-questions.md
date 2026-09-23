# Open questions

> Seams we *expect* to tear but haven't verified. Ordered roughly by "how badly
> does this hurt if wrong." Resolve by experiment or upstream reading, then move
> to decisions.md or the relevant doc.
>
> **Status legend** — ✅ answered (source-verified, 2026-09 substrate pass,
> evidence in prior-art/), 🔬 desk-answered pending lab confirmation,
> ⏳ still open.

## Blocking (answer before/while prototyping)

1. ✅ **Does the renderer include glob cover `.tsrx`?** — **Yes.** Rules are
   arbitrary filename globs matched by `resolveRendererForFile`; no extension
   check. `nativeScriptRenderers({ include: 'src/**/*.{tsx,tsrx}' })` covers
   both. (`octane/src/compiler/renderers.js`, `nativescript-octane/config.ts`.)
   Bonus: `.tsrx` files are Octane-owned *by extension* — no pragma needed.
2. ✅ **Export delta `octane` vs `octane/universal/native`.** — Enumerated:
   universal-core exports the full hook set, `memo`, `lazy`, `use`, `useContext`,
   `createContext` (native variant), `createPortal` (capability-gated),
   `Activity`, transitions, `createUniversalRoot`, `createObjectDriver`.
   Absent: `Suspense`, `ErrorBoundary`, `Fragment` components (use
   `@try`/`@pending`/`@catch`), `createRoot`, `ViewTransition`, resource hints,
   DOM utilities. Full list: prior-art/octane.md → "universal export surface".
3. ✅ **NS ListView item templates vs Octane's reconciler.** — Answered on
   device (iOS sim): ListView recycles via `itemLoading`/`itemTemplate`; the
   leaf hosts **per-cell `createNativeScriptRoot` sub-roots** re-bound by
   `itemLoading`, `items` fed as `ObservableArray`. Confirmed: roots mount
   and reuse correctly; item rebinds render right data. Surfaced seams:
   itemLoading refires on any layout-affecting render; host↔index rotates
   between waves; `e.item` lags splice; `useRef` reads go stale inside
   pre-commit event closures — leaf works around all four (module-scope
   maps + authoritative `items[index]` + post-splice `refresh()`). Open
   follow-up: scroll-range recycling (only 5 visible cells tested), Android
   parity, and whether the driver should own `items`-diff → `refresh()`
   ([nativescript-community/octane#1](https://github.com/nativescript-community/octane/issues/1)).
4. ✅ **Controlled text inputs.** — Verified on device (iOS sim, synthetic
   `textChange` via `view.notify`): native→state (`textChange`→`onChange`)
   and state→native (`text` prop write) both work. Two real seams found:
   (a) **programmatic `text` writes echo back as `textChange`** → each write
   produced a spurious `onChange`. **Fixed in the driver** — our report became
   upstream #5, shipped in 0.2.1 (per-node `muted` set during the driver's own
   prop write). Verified: one synthetic `textChange` → exactly one `onChange`,
   and the self-test's `setText('hello')` no longer echoes.
   (b) The driver's same-value guard (`view[name] === value → skip`) already
   prevents redundant writes on the state→native path. Still open: cursor
   position on programmatic `text` writes mid-typing (UITextField.text
   assignment may reset cursor to end) and Android IME composition. Basic
   real typing verified manually on the iOS sim (keystrokes + taps
   round-trip through `onChange`/`onPress` correctly).
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
12. ⏳ **Two dev servers on one tree.** — Lab. Watcher contention and
    `import.meta.hot` semantics per-server should be fine in principle (each
    dev server holds its own module graph), but verify `ns debug` doesn't
    fight `vite dev` over `.tsrx` writes mid-save.
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
16. 🔬 **`@for` keys → native identity.** — Reorder on `listview` delegates to
    recycling anyway (items are data, not views); for non-list parents,
    `insert`/`move` commands handle keyed reorder on real views. Lab-confirm
    nothing pathological.
17. ⏳ **Bundle impact of platform modules** — verify `.native` files and NS
    imports are fully eliminated from web output (and vice versa); treeshake
    check, not assumption.
18. ⏳ **Fonts**: `font-family` token → registered font name on iOS vs Android
    vs web — a small but certain mapping table to own.
19. 🔬 **`getCssVariable` timing** — reading tokens from JS at mount vs after
    CSS applies; theme toggle propagation into modal/keyboard windows
    (ns-octane hit this — composer re-walks styles on appearance change).
20. ✅ **SSR DOM assumptions in shared output.** — Not an issue by
    construction: universal renderers are `server: 'unsupported'`; SSR only
    ever runs on DOM-compiled output (shared files compiled under `dom` for
    web). The DOM build's SSR output is DOM-correct; the native build never
    sees it.
