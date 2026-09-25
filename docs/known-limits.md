# Known limits

> What is broken upstream, platform-bound, or deliberately asymmetric in the
> current release — read before promising behavior on a seam. Each entry is
> stamped with the version it was last verified against; the list is
> re-checked in the pre-release docs sweep.

## Broken upstream (filed; tracked, not worked around)

- **Pushing into a named stack is iOS-only.** `Frame` inside `TabViewItem`
  commits pushes but loses bookkeeping, and raced pushes can crash
  Android's fragment manager. `pushRoute` into a named stack warns loudly
  on Android instead of dropping silently. Root-stack navigation works on
  both platforms. [NativeScript#11444](https://github.com/NativeScript/NativeScript/issues/11444)
  — verified at 0.4.0.
- **`.tsrx` files don't emit `.d.ts`.** Upstream tsrx#136 → TS#64120/#64053.
  `@octane-xplat/ui` ships a generated `props.d.ts` plus hand-maintained
  shells, so consumers still get full types. — verified at 0.4.0.
- **Literal `@{` in JSX text** parses as a code block: evaluated and
  discarded on web, a compile error on native. Write `{'@'}{expr}` —
  `<Text>{'@'}{user.handle}</Text>` renders `@handle`. Upstream fix
  intentionally not pursued. — verified at 0.4.0 on all targets.

## Boundaries (works, with an edge)

- **`.tsrx` infers effect deps from closure reads.** An effect that only
  writes (refs, DOM) and never reads its driving prop compiles to a deps
  array that omits it — declare deps explicitly:
  `useLayoutEffect(fn, [props.value])`. — verified at 0.4.0.
- **`onInput`/`onChange` can dispatch repeatedly on web** — the
  controlled-input machinery replays events. Keep handlers idempotent.
  — verified at 0.4.0.
- **Hardware back (Android)** is wired and its fallthrough is verified;
  the pop-while-pushed path is logically correct but not yet verified
  live. — verified at 0.4.0.
- **`ScrollBox` is not a scroller on native** — it is a plain inline
  container so a nested `List` can own scrolling (the name is a footgun;
  use `ScrollView` when you want actual scrolling). — verified at 0.4.0.
- **`List` is not virtualized on web**, and on native it throws inside a
  `ScrollView`. `keyFor` is web-only. — verified at 0.4.0.
- **`Modal` on Android**: a non-fullscreen modal shows a centered dialog,
  not a bottom sheet. Context and theme do not cross overlay roots — read
  them inside the overlay or pass values down. — verified at 0.4.0.
- **`Drawer` has no edge-swipe gesture on web** — give the app a visible
  toggle. — verified at 0.4.0.
- **`TextArea` `onSubmit` on native** fires only when `returnKeyType` is
  `done` or `send`; otherwise every newline reports as a submit. On web it
  fires on Cmd/Ctrl+Enter. — verified at 0.4.0.
- **`Grid` `gap`** is accepted but warns and no-ops on both platforms —
  use child margins. — verified at 0.4.0.
- **`console.debug` doesn't exist on device** — use `console.log`. The
  lint ruleset flags it. — verified at 0.4.0.

## Design debts (documented, not bugs)

- **Route params are scalar.** They serialize as query strings on web —
  objects survive on native and are silently dropped on web. Keep params
  to strings and numbers. — 0.4.0.
- **`popRoute(stack)` on web is `history.back()` regardless of stack** —
  one linear history cannot pop a non-top route. — 0.4.0.
- **Deep imports don't extension-resolve** — barrel imports only. — 0.4.0.
- **No `PLATFORM` constant** — platform divergence goes through leaf
  files, by design. — 0.4.0.
- **Plain `.ts` files escape the compiler's DOM-global checks** — `pnpm
  lint` (`xplat/no-dom-globals`) is the backstop; keep DOM code in `.tsrx`
  leaves where possible. — 0.4.0.
- **Deep imports under `@nativescript/core/ui/*`** bundle as a second
  module instance — import from `@nativescript/core` only. Lint-enforced.
  — 0.4.0.
- **`.tsrx` files reject `async` top-level functions** — the compiler
  treats them as async components, and an `async` function that never
  awaits still breaks `ns build`. Drop the keyword. — 0.4.0.
