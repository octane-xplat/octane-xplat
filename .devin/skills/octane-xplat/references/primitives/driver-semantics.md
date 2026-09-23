# Driver semantics — how leaves bind

Niche detail: what the universal driver actually does with the leaf's JSX.
Needed when a leaf misbehaves, not for normal component use.

## Leaf shape

```tsrx
/** @jsxImportSource @nativescript-community/octane */   // line 1, native only
import { useCallback } from 'octane';                     // universal hooks — compiler retargets
import type { ViewProps } from './props';

export function View(props: ViewProps) @{
	<contentview id={props.id} ...>{props.children}</contentview>
}
```

- The `@jsxImportSource` pragma MUST be line 1 — any import/comment before
  it demotes the file to DOM intrinsics and typecheck explodes.
- Hooks import from `'octane'` even on native — the compiler retargets to
  `@nativescript-community/octane`. The native build also aliases
  `octane` → `octane/universal/native` so dep-scanning doesn't vendor the
  DOM runtime.
- `component X` declarations type as `() => Element` in .ts files — cast
  to `UniversalComponent` when passing to `createNativeScriptRoot`.

## Driver-owned machinery (upstream, since ns-octane 0.2.1)

- `renderItem` on `<listview>` → real ListView cells with recycling.
- `onX` props → `addEventListener('x')` generically — gesture props map 1:1.
- `checked`/`text` writes are echo-suppressed (driver skips the write-back
  when the change originated natively).
- Validation (`forbiddenGlobals`/`forbiddenImports`) is compile-pipeline
  only — `.tsrx`/`.tsx` under a renderer rule. Plain `.ts` helpers are NOT
  checked — a `document` in a helper slips through (that's what
  `check:no-dom` catches).

## Root creation

`createNativeScriptRoot(hostView).render(Component, props)` — each pushed
Page, modal, sheet host, tab-stack page, and List cell gets its own root.
Roots share NOTHING (no context, no store) — cross-root state goes through
module-scope stores, and each root applies its own theme class.

## Frame/page containers

- `Page` = the nav unit. `page.actionBarHidden = true`, `page.id` set for
  probes.
- `TabViewItem` content is a plain native view — the driver can't parent
  reconciled children into `<tabviewitem>`; each pane is a `ContentView`
  hosting its own root (or a `Frame` for stack panes).
