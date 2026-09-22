# Open questions

> Seams we *expect* to tear but haven't verified. Ordered roughly by "how badly
> does this hurt if wrong." Each entry: the question, why it matters, how to
> check. Resolve by experiment or upstream reading, then move to decisions.md
> or the relevant doc.

## Blocking (answer before/while prototyping)

1. **Does the renderer include glob cover `.tsrx`?** Defaults shown are
   `src/**/*.tsx`. If `.tsrx` isn't coverable, our dialect choice narrows to
   `.tsx` for native-owned files.
   → Check `nativeScriptRenderers`/vite-octane source.
2. **Exact export delta between `octane` and `octane/universal/native`.**
   Which imports in shared code are safe — `use()`, Suspense, `@for`, context,
   transitions, portals? Enumerate exports of both entry points.
   → `Object.keys` diff + read the universal runtime source.
3. **NS ListView item templates vs Octane's reconciler.** ListView wants an
   `itemTemplate` function producing views per item — how does that compose
   with compiled plans and `@for`? Determines the `List` primitive's real API.
   → Experiment: `listview` + `itemTemplate` in the reference app style.
4. **Controlled text inputs.** Driver assigns `text` prop on update — does a
   controlled `value` fight typing/cursor/IME on `textfield`/`textview`?
   → Type a controlled input on device.
5. **Resolver ordering vs renderer scoping.** Our platform resolver must run
   before Octane's compiler sees the file, and ownership follows the *resolved*
   path. Confirm plugin order + that include glob matches resolved `.native.`/
   `.ios.` files.
   → Prototype with a deliberately platform-split leaf.

## Significant

6. **Suspense/`use()` on the universal runtime** — boundaries exist? SSR is
   obviously web-only, but is client Suspense universal? Needed for the
   loaders/nav plan.
7. **Portals on native?** If the universal ABI supports portals, `Overlay`/
   `Popover` primitives get much easier (rootlayout overlay). If not, design
   stands anyway (rootlayout/manual).
8. **NS CSS transition support** — `@keyframes` yes; `transition:` property?
   Determines whether simple hover/state animations need the JS facade.
   → Docs/source grep; quick device test.
9. **`className` clsx composition on native** — Octane composes arrays/objects
   everywhere; does the driver pass composed values into NS CSS correctly?
10. **`style` object prop semantics** — units (dip vs px), camelCase keys,
    which CSS props survive `view.style` assignment vs className path.
11. **CSS selector coverage** — descendant/child combinators, attribute
    selectors, pseudo-classes (`:highlighted`, `:active`?) — defines the
    shared stylesheet's allowed grammar.
12. **Two dev servers on one tree** — vite dev (web) + `ns debug` (native)
    watching the same files: watcher contention, `import.meta.hot` in shared
    modules hitting both servers correctly.
13. **Multiple renderers in one vite config** — probably unnecessary (two
    configs), but worth knowing if a future target wants it.

## Later / finer

14. **HMR accept shape for route files** — does `hmrUniversalComponent` prefer
    named exports like React Refresh? Affects route conventions.
15. **A11y prop parity** — map `accessibilityRole/Label/Hint/Value` to ARIA
    roles precisely; NS role names ≠ ARIA role names 1:1.
16. **`@for` keys → native identity** — keyed reorder on `listview` vs
    template recycling; may push more logic into the `List` primitive.
17. **Bundle impact of platform modules** — verify `.native` files and NS
    imports are fully eliminated from web output (and vice versa); treeshake
    check, not assumption.
18. **Fonts**: `font-family` token → registered font name on iOS vs Android vs
    web — a small but certain mapping table to own.
19. **`getCssVariable` timing** — reading tokens from JS at mount vs after
    CSS applies; theme toggle propagation into modal/keyboard windows
    (ns-octane hit this — composer re-walks styles on appearance change).
20. **SSR asymmetry in shared screens** — if a shared screen is ever SSR'd on
    web, its module-scope code must be DOM-free anyway; but verify Octane's
    SSR compiler path doesn't emit DOM assumptions into shared component
    output.
