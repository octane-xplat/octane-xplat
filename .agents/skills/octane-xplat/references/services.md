# Platform services

Per-platform `.ts`/`.tsrx` twins under `packages/app/src/platform/` —
the service-seam pattern (capability interface, two leaves).

## `storage` — key/value

`storage.native.ts` → `ApplicationSettings`; `storage.web.ts` →
`localStorage`. Verified round-trip + draft persistence on both.

```ts
storage.setString('k', v)
storage.getString('k')
```

## Color scheme

`getColorScheme()` / `useColorScheme()` — `ColorScheme = 'light'|'dark'`.

- Web: `matchMedia('(prefers-color-scheme: dark)')` + change listener.
- Native: `Application.systemAppearance()` (falls back during early boot —
  the primary window isn't guaranteed yet) + appearance-change events.
- Manual override lives in app state (`override ?? scheme`), applied as
  `dark ns-dark` on the app root — see styling/root-boundaries.md for the
  cross-root rule.

## Animation — `useAnimation(initial, prop)`

Returns `AnimatedValue`: `{ value, bind(el), to(target,{duration}),
spring(target,{damping,stiffness}), stop() }`.

- `bind` is a leaf `bind` prop target — forwards to the intrinsic's `ref`,
  the tween writes the view directly (no re-render per frame).
- Web: rAF tween writes `el.style`. Native: writes the NS view property.
- Verified: `anim settled` assert on both (native timing is looser — probe
  tolerances account).

## Gestures

Normalized payloads (primitives.md). Pan on web = raw pointer listeners
(`pointermove` isn't delegated — that's why `bind` exists); on native =
NS `pan` recognizer mapped to `{deltaX/deltaY → x,y,dx,dy, state enum →
began/moved/ended/cancelled}` — velocity is 0 on native until recognizer
velocity wiring lands.

## nav / sheet / overlay / route / stacks twins

Covered in navigation.md + overlays.md. The twin list that must stay
parity-complete: `nav`, `sheet`, `overlay`, `storage`, `demosweep` (probe),
and in `packages/ui`: `stacks`, `route`, `anim`, `colorScheme`, every
component leaf.

## Adding a service

1. `platform/foo.native.ts` (real impl) + `platform/foo.web.ts` (impl or
   explicit no-op stub + log) — same export names.
2. Export through the package barrel (deep specifiers don't
   extension-resolve).
3. If it touches a DOM global on web — fine, web leaf is DOM territory;
   the `.native` twin must stay DOM-free (check:no-dom).
