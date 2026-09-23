# Testing

> Three layers: logic, component, device. The asymmetry to accept early —
> native component verification is the weak leg.
>
> **Owns:** #4 seam enforcement · **Status:** mapped · **Blocks on:** none —
> rules are writable today · **Decisions:** #3, #4 (the invariants it enforces)
> · **Validated by:** an intentionally-violating file failing lint/typecheck.

## Layers

| Layer | Tool | Target |
|---|---|---|
| Logic (`packages/core`, hook-free) | vitest, plain node | both — DOM-free by definition |
| Hook-containing shared modules | vitest + octane runtime | must be run inside a renderer-owned test env — verify how tests satisfy the ownership rule (open-questions) |
| Components | vitest + DOM renderer (web leaf impls) | web leaf = real test; shared-file behavior tests run through web impls |
| Native leaf correctness | vitest + **`createObjectDriver`/`createObjectContainer`** | universal-core ships a built-in object renderer — assert host-command streams (`create gridlayout`, `event tap`) with no device and no NS runtime. Stronger than a hand-rolled mock: same ABI the real driver implements |
| On-device | `ns debug` + manual / Appium later | the real rendering ground truth |

## Enforcement tests (the cheap wins)

Two layers — **compile-time first** (verified machinery), lint as backstop:

**Layer 0 — the compiler's own `renderers.*.validation`** (decision #20).
The renderer config accepts `forbiddenGlobals`, `forbiddenImports`,
`textHosts`, `textParents`, `hostProps` — enforced at compile time on owned
files AND on `.ts` helpers matched by the rule. Declare on the nativescript
registry entry (or wrap `nativeScriptRenderers` in our own config helper):

```ts
validation: {
  forbiddenGlobals: ['document', 'window', 'localStorage', 'navigator', 'fetch'],   // DOM/browser — except fetch? NS has fetch; keep list real
  forbiddenImports: ['octane', 'octane/hydration', /^octane\/react/],               // DOM runtime + react compat
  textHosts: ['label', 'button', 'formattedstring', 'span', 'textfield', 'textview'],
  textParents: [/* same set — text only inside text hosts */],
  hostProps: { /* allowlist per tag, if we want tighter than class-derived props */ },
}
```

Then lint-level rules for what validation can't express:

- **No DOM globals in shared files** — eslint `no-restricted-globals`
  (`document`, `window`, `localStorage`, …) scoped to shared globs. (The
  nativescript validation covers native-owned files; this covers shared +
  web-owned.)
- **No intrinsics in shared files** — custom rule or codemod check: lowercase
  JSX tags outside `*.web.*`/`*.native.*` leaf files are an error (all shared
  JSX should be capitalized components). Note: `hostProps`/`textHosts`
  validation already constrains native-owned files — this rule targets the
  shared set.
- **Hooks only in owned extensions** — `.ts` files calling `use*` flagged
  (doubly important on native: `.ts` hook slotting emits `from 'octane'` →
  DOM runtime → dead dispatcher).
- **CSS property allowlist** — warn on properties outside the NS∩web support
  matrix (silent drops AND silent per-declaration partial application are the
  documented traps).
- Boundary lint: `packages/core` never imports `packages/ui`; UI leaf files
  are the only place `@nativescript/*` appears.

## Typecheck matrix

`tsconfig.web.json` and `tsconfig.native.json` both run `tsc --noEmit` — shared
files must pass under both `jsxImportSource`s. This is the single most
valuable CI signal for "the seams held."

## Component test strategy

- Write component tests against the **web leaf** impls (jsdom/happy-dom +
  octane test utils — check what `test-utils/` in octanejs/octane offers).
- A minimal fake-host-driver for universal-runtime tests lets us assert
  command streams (`create gridlayout`, `event tap`) without a device — steal
  the harness pattern from `nativescript-community/octane` `tests/`.
- Snapshot discipline: assert behavior/a11y, not emitted markup — the two
  renderers emit different trees by design.

## e2e reality check

- Web: Playwright is straightforward. **Lab (web smoke):** `pnpm smoke`
  in `apps/web` — builds dist, serves via `vite preview`, drives headless
  Chromium: App mounts, `onClick`→state, tab switch, chip→real-path
  route write, pane render, popstate restore, deep-link boot, sheet-stub
  call, zero pageerrors — 14/14. Runtime evidence for the web target —
  until now it was only proven to compile. Selector note: `Pressable`
  renders `div[role="button"]`.
- Native: weak ecosystem — Appium or `nativescript-dev-appium`-era tooling;
  plan manual smoke scripts + screenshot capture per release until this
  matures. Sameframe-style parity checking is web-only. The harness probe
  timeline (tap synthesis via gesture observers + view-tree text reads)
  covers this today on iOS.
- HMR confidence is manual: the ns-octane workflow (edit while streaming,
  watch in-place accept) is the bar.

> [!CAUTION]
> `tsrx-tsc` rejects literal non-ASCII characters in JSX text (e.g. `•`) —
> Vite tolerates them, typecheck doesn't. Emit them as expressions:
> `<Text>{'• '}</Text>`.

> [!NOTE]
> Passive effects don't reliably drain after events dispatched outside
> octane's batch — raw `<a>` clicks and `popstate` re-render but leave
> `useEffect` unflushed (observed in the docs app: sidebar `Pressable` nav
> flushed a slug-dep effect; an `<a>` nav did not). Assert post-nav state
> imperatively, or trigger an octane-handled event first.

## CI ordering

Lint seam-rules → typecheck both → vitest → web build → (gated) native builds.
Native build failures should never block logic iteration — run them nightly
or on-demand early, per-PR later.
