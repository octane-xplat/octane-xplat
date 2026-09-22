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
| Native driver correctness | vitest + mock host driver | the port's own `tests/` run this way — reuse the pattern for our leaf impls where feasible |
| On-device | `ns debug` + manual / Appium later | the real rendering ground truth |

## Enforcement tests (the cheap wins)

The seam rules in architecture.md are lintable, and catching violations
mechanically is worth more than most unit tests:

- **No DOM globals in shared files** — eslint `no-restricted-globals`
  (`document`, `window`, `localStorage`, …) scoped to shared globs.
- **No intrinsics in shared files** — custom rule or a simple codemod check:
  lowercase JSX tags outside `*.web.*`/`*.native.*` leaf files are an error
  (all shared JSX should be capitalized components).
- **Hooks only in owned extensions** — `.ts` files calling `use*` flagged.
- **CSS property allowlist** — warn on properties outside the NS∩web support
  matrix (silent drops are the documented trap).
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

- Web: Playwright is straightforward.
- Native: weak ecosystem — Appium or `nativescript-dev-appium`-era tooling;
  plan manual smoke scripts + screenshot capture per release until this
  matures. Sameframe-style parity checking is web-only.
- HMR confidence is manual: the ns-octane workflow (edit while streaming,
  watch in-place accept) is the bar.

## CI ordering

Lint seam-rules → typecheck both → vitest → web build → (gated) native builds.
Native build failures should never block logic iteration — run them nightly
or on-demand early, per-PR later.
