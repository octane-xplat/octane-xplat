# xplat

> One [Octane](https://github.com/octanejs/octane) codebase, three targets:
> web via the DOM renderer, iOS and Android via NativeScript
> ([`@nativescript-community/octane`](https://github.com/nativescript-community/octane)).
> Guides are in the sidebar; the design record — decisions, open questions,
> lab logs, status — lives under **notes**.

## Start here

- [spec](spec.md) — the whole design on one page.
- [architecture](architecture.md) — the model, and the invariants that keep
  the seams from tearing.
- Then the domain guides: [primitives](primitives.md),
  [styling](styling.md), [module-resolution](module-resolution.md),
  [navigation](navigation.md), [platform-services](platform-services.md),
  [animation-gestures](animation-gestures.md), [testing](testing.md),
  [toolchain](toolchain.md).

## What we own vs. what upstream owns

Seven problems are ours — primitives, navigation, module resolution, seam
enforcement, animation/gestures, platform services, toolchain. Each has a
domain guide. Upstream covers: renderer + host driver + element registry +
on-device HMR (`@nativescript-community/octane`), the styling engine (real
CSS/vars/media queries/keyframes on both targets), the worklet/bridge
runtime, nav containers (`frame`/`tabview`/`ui-drawer`/`showModal`), the
native bundler pipeline (`@nativescript/vite`), and the DOM renderer + SSR
(octane).

## Notes

The design record is kept separate so guides stay readable: [decisions](decisions.md)
(commitment ledger), [open-questions](open-questions.md) (unverified seams),
[demos](demos.md) (the demo-suite lab journal), [status](status.md) (the
ownership/tracking dashboard, plus doc-writing conventions).
