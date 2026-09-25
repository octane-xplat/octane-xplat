# prior-art/

These files document **other people's systems** — what they are, how they work, and
what we can take from them. Nothing in here is our plan. Our plan lives in
[`../docs/`](../docs/).

The distinction matters: when a design decision is in doubt, check whether it traces
to a file in `docs/` (our commitment) or here (context that informed it).

## Substrate (what we build on — fixed, external)

| File                                             | System                                           | Why we care                                                                                       |
| ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [octane.md](octane.md)                           | `octane` runtime + compiler                      | The framework. Defines the universal runtime, the renderer ABI, and which APIs are DOM-only.      |
| [nativescript-octane.md](nativescript-octane.md) | `@nativescript-community/octane` + `vite-octane` | The renderer port: host driver, element registry, HMR. Also covers the `ns-octane` reference app. |
| [nativescript-core.md](nativescript-core.md)     | `@nativescript/core`                             | The actual native platform: layouts, CSS engine, events, animation, navigation, globals.          |

## Design precedents (what we learn from — patterns to steal)

| File                                       | System             | What it teaches                                                                                                                                                                              |
| ------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [one.md](one.md)                           | One (onestack.dev) | Platform file suffixes at _route_ granularity, `_layout` composition, render-mode suffixes, loaders, typed routes. Also: how hard "Vite on native" is.                                       |
| [tamagui.md](tamagui.md)                   | Tamagui            | `styled()` + variants + token themes as a component API over primitives.                                                                                                                     |
| [react-native-web.md](react-native-web.md) | react-native-web   | Proof that converging on RN's constrained API surface and implementing it over DOM works. Event/accessibility normalization.                                                                 |
| [flutter.md](flutter.md)                   | Flutter            | Animation API shape (`AnimationController`/`Tween`/`Curve`), widget-composition idioms worth borrowing, Navigator 2.0 declarative routing.                                                   |
| [lynx.md](lynx.md)                         | Lynx (lynxjs.org)  | Same destination by a different road: lowercase element vocabulary → native views, dual-thread React. Thread tax validates JS-on-UI-thread; Snapshot IR confirms Octane's universalPlan ABI. |

Related but folded into the files above: React Native itself (the API-surface
lingua franca — see react-native-web.md), Expo Router (One is derived from it —
see one.md), React Navigation (native nav model One sits on — see one.md and
navigation.md).
