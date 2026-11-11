# @octane-xplat/tweaks

Live-tweakable values (`useTweak`) for Octane Xplat apps, edited from a
devtools panel, written back to source only on Save.

## Layout

- `src/` — runtime hook (`useTweak`, `useTweakStyles`, `useTweakStyles` web
  leaves), shared protocol types (`protocol.ts`), and the app client
  (`client.ts`). Ships source with `web`/`native`/`default` export conditions,
  like framework leaf packages. Hook code lives in `.tsx`.
- `src/vite/` — the Vite plugin (`./vite` subpath, Node only, emitted JS +
  declarations to `dist/vite/` and `types/vite/`; plugin goes **before** the
  Octane plugins). The plugin must not runtime-import `.ts` source such as
  `protocol.ts` from outside `src/vite/` — shared message types are
  type-imported only.
- `test/` — `node --test` unit tests (`test:e2e` in `apps/tweaks-playground`
  is the transport integration test).

## Transport — protocol v5 over the devtools hub

`TWEAKS_PROTOCOL_VERSION = 5`. There is no standalone socket: the app opens
`openDevChannel<ServerToApp, AppToServer>('tweaks', 5)` from
`@octane-xplat/devtools/app` lazily on first mount and re-sends the full
mounted set on every `live` transition; the Vite plugin's backend runs
`connectDevBackend('tweaks')` from `@octane-xplat/devtools/backend` inside
`configureServer` and is inert (transform/strip still apply) when not under
`xplat dev`. Hub session ids are clientIds; a session's platform is its
label. Panels open with a `hello` frame and receive `state`; `saveResult` /
`savePreview` go to the requesting panel only, `picked` to all panels. Hub
frames are capped at 256 KiB — the backend logs `oversize` channel errors.

The dev gate is the bare `__OCTANE_TWEAKS__ === true` marker; the plugin
substitutes it in served modules (Vite's dev client pipeline does not apply
`config.define` to package source outside root). Apps may import the runtime
from either `@octane-xplat/tweaks` or the umbrella `octane-xplat/tweaks`;
the plugin's `resolveId` re-resolves its injected `@octane-xplat/tweaks/dev`
imports from its own package.

## Conventions

- Bun; `workspace:*` for workspace deps; root catalogs for external pins;
  erasable TS only (no enums, namespaces, parameter properties).
- Styles: `src/vite` also extracts static CSS — bamboo `css({…})` calls and
  inline `style={{…}}` — into a style manifest. Style drafts edit live
  (inline via `useTweakStyles`/`__tw` from `@octane-xplat/tweaks/dev`; bamboo
  via `__twCss` marker classes + a web MutationObserver leaf) and are written
  back on Save through `planStyleEdit`. Bamboo preview compiles drafts
  through `loadConfigAndCreateContext` in-memory (optional `@bamboocss/node`,
  degrades to `preview:'unavailable'`); the native `__twCss` leaf is a
  pass-through — bamboo sites mount on web only.
- `pick`/`picked` implement web click-to-pick (`state.picking`); `savePreview`
  returns the same plan Save would write as capped per-file unified diffs.
  The backend cannot see panel disconnects — the panel sends `pick:false` on
  unmount to end a pick.
