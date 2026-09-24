# Known limits — what's actually broken or unproven

Read before promising behavior or building on a seam.

## Broken upstream (not ours to fix today)

- **Android nested stacks** — `Frame` inside `TabViewItem`: pushes commit
  but bookkeeping (`currentPage`/`backStack`/`goBack`) never lands; raced
  pushes crash the FragmentManager. [NativeScript#11444](https://github.com/NativeScript/NativeScript/issues/11444)
  (open, assigned — also covers the iOS `isLoaded` strand we workaround).
  **Named-stack pushes are iOS-only** until resolved or the shell changes
  shape; `pushRoute` into a named stack on Android warns loudly rather
  than dropping silently.
- **`.d.ts` emit for .tsrx** — upstream tsrx#136 → TS#64120/#64053.
  Workaround shipped (emitted `props.d.ts` + hand shell) — consumers get
  types, but component shells are hand-maintained.
- **Literal `@{` in JSX text** — `@{expr}` at child position parses as a
  code block, not `@` + `{expr}`. On DOM the expression is evaluated and
  discarded (renders nothing); on universal renderers it's a compile error
  (`Not implemented: JSXCodeBlock` / `unsupported template node`). Write
  `{'@'}{expr}` instead — e.g. `<Text>{'@'}{user.handle}</Text>` renders
  `@handle`. Verified against octane 0.4.x on all targets; upstream fix
  intentionally not pursued.

## Verified-with-boundaries

- **tsrx infers effect deps from closure reads** — an effect that only
  touches refs/DOM (never reads the driving prop) compiles to a deps array
  that omits it, so it won't re-run when that prop changes. State deps
  explicitly (`useLayoutEffect(fn, [props.value])`) — `TextArea.web`'s
  auto-grow re-fit is the example (inferred `[maxRows, autoGrow]`, missed
  `value`).
- **`onInput`/`onChange` can dispatch repeatedly on web** — one Playwright
  `fill` logged 5× `textareaChange`; the controlled-input repair machinery
  replays events. Handlers must be idempotent.
- **Hardware back (Android)** — `wireHardwareBack()` wired + fallthrough
  verified; the pop-while-pushed path is logically correct but unverified
  live (probe pushes auto-pop in ~500ms — needs a persistent route to test).
- **Pan velocity on native** — `vx`/`vy` are 0 (recognizer velocity not
  wired); positions/states are real.
- **Sheet on web** — stub only (console.log). `Modal` is real on web
  (`<dialog>`); sheet is native-only until designed.
- **`lastDemo`-style stores cross roots** — verified pushed page → sheet →
  gallery on iOS; the same pattern is REQUIRED for theme (see
  styling/root-boundaries.md).

## Uncharacterized flakes (seen once, not root-caused)

- list cell-restore on Android once
- `anim settled` timing variance
- one `modal texts` flake
- `dark class` flake — FIXED (toggle had no id; now `scheme-toggle` +
  deterministic probe)

## Design debts (documented, not bugs)

- Params serialize as query strings on web — object params don't survive
  (screen props are `Record<string, unknown>` on native, strings on web).
  Keep params scalar for cross-target parity.
- `popRoute(stack)` on web is `history.back()` regardless of `stack` —
  one linear history can't pop a non-top route.
- Deep imports don't extension-resolve — barrel imports only.
- No unified `PLATFORM` constant by design — use leaves.
- `.ts` helpers escape compiler-side forbiddenGlobals — `check:no-dom`
  is the backstop; keep DOM code in `.tsrx` leaves where possible.
