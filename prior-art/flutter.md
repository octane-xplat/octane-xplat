# Flutter

> Not a codebase-sharing precedent — a _design vocabulary_ precedent. Flutter
> solves cross-platform by owning the whole render stack; we solve it by
> targeting two real platforms. What transfers is API shape.

## Things worth taking

### Animation API shape — the strongest import

`AnimationController` + `Tween<T>` + `Curve` + `AnimatedBuilder` is the
cleanest mainstream animation model:

- controller owns duration/repeat/reverse/status; `addListener`/`addStatusListener`
- `Tween` maps progress→value; `Curve` maps time→progress (named curves:
  `easeInOut`, `spring`-ish via physics sims)
- composition: `CurvedAnimation`, `TweenSequence`, `Interval`, `StaggeredAnimation`
- explicit dispose ownership — controllers are created/disposed with the widget

For us: a shared `useAnimation({ duration, curve })`/`animateTo()` facade that
drives `view.animate()` on NS and WAAPI/`@octanejs/motion` on web. Because NS JS
is on the UI thread, per-frame JS-driven animation is viable there in a way RN
needed worklets for — our facade can be simpler than Flutter's and simpler than
Reanimated's. See `docs/animation-gestures.md`.

### Navigator 2.0 — declarative routing

Flutter's imperative `Navigator.push` got retrofitted with a declarative
page-stack model (Router API): the visible stack is a function of state, back
button is an event that mutates state. This is the right mental model for
reconciling URL routing (web) with `Frame` stacks (native): **state → stack of
pages**, with the platform shell rendering it. One's file-system routing is a
concrete instance of the same idea — see `docs/navigation.md` and
`prior-art/one.md`.

### Composition idioms

- `Padding`, `Align`, `Expanded`, `SizedBox`, `SafeArea`, `MediaQuery.of`,
  `LayoutBuilder`, `GestureDetector` — small single-purpose layout/query
  widgets. Several map to primitives we want anyway (`SafeArea`, `Expanded` →
  flex grow, `LayoutBuilder` → a `useParentSize`-style hook).
- `Theme.of(context)` / `DefaultTextStyle.of` — inherited ambient values. For
  us that's Octane context + CSS custom property scoping (`.ns-dark` vars
  cascade natively on NS via `style.getCssVariable` inheritance).

### Explicit edge-insets / spacing values

Flutter's `EdgeInsets` discipline (symmetric/only/all constructors) is a good
shape for any _style-object_ prop we keep — e.g. a `pad` prop that compiles to
padding CSS on web and padding props on NS.

## What not to take

- "Everything is a widget" granularity — we have real CSS on both targets;
  don't encode `Container(color:)` as a component when `className` does it.
- Flutter's _layout constraint_ system (constraints go down, sizes go up) as a
  mental model — NS layouts are discrete classes with per-parent props
  (`row`, `dock`, `orientation`); our primitives should expose the NS layout
  vocabulary honestly, wrapped in Row/Column/Grid sugar.
- The render-object ownership model — irrelevant, both our targets have real
  layout engines.
