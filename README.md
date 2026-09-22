# octane-xplat

Design docs for a single [Octane](https://github.com/octanejs/octane) codebase
targeting **web** (DOM renderer) and **iOS/Android** (via
[`@nativescript-community/octane`](https://github.com/nativescript-community/octane),
the universal-runtime driver over `@nativescript/core`).

**Status: pre-implementation.** No code yet — the point of this tree is to map
every seam between the two realities before writing any.

## The model in one paragraph

One source tree, compiled once per target. Renderer ownership is decided per
file at compile time, so a shared `.tsrx` component compiles under the DOM
renderer in the web build and the NativeScript renderer in the native build.
A file can speak only one element vocabulary, so platform divergence happens
at file boundaries (`Foo.web.tsrx` / `Foo.native.tsrx` / `Foo.ios.tsrx`)
resolved by a Vite plugin, plus a `Platform` module for value-level splits.
Everything shared sits above a primitives layer (`View`/`Text`/`Pressable`…)
and a headless platform-services layer.

## Reading order

1. [docs/architecture.md](docs/architecture.md) — the model, layering, invariants
2. [docs/module-resolution.md](docs/module-resolution.md) — suffix convention, resolver, tsconfigs
3. [docs/primitives.md](docs/primitives.md) — the component vocabulary + leaf map
4. [docs/styling.md](docs/styling.md) — shared CSS strategy, tokens, traps
5. [docs/navigation.md](docs/navigation.md) — route table + per-platform shells
6. [docs/animation-gestures.md](docs/animation-gestures.md) — animation facade, gesture normalization
7. [docs/platform-services.md](docs/platform-services.md) — capability interfaces
8. [docs/toolchain.md](docs/toolchain.md) — builds, HMR, version pinning, CI
9. [docs/testing.md](docs/testing.md) — test layers + seam lint rules
10. [docs/decisions.md](docs/decisions.md) — decision ledger
11. [docs/open-questions.md](docs/open-questions.md) — unverified seams, ranked

## prior-art/

Documentation of **other people's systems** — substrate (octane, the NS port,
`@nativescript/core`) and precedents (One, Tamagui, react-native-web, Flutter).
Nothing in there is our plan; see [prior-art/README.md](prior-art/README.md).

## First prototype (when coding starts)

The smallest slice that exercises every load-bearing seam at once:

- `Platform` module + `View`/`Text`/`Pressable` primitives with `.web`/`.native`
  leaves
- one shared screen: `useState` counter + `@for` list + Tailwind classes
- `vite dev` (web) and `ns debug ios` (native) running off the same source,
  HMR working on both

If that round-trips, the architecture holds and remaining work is surface area.
The top five [open questions](docs/open-questions.md) get answered by it.
