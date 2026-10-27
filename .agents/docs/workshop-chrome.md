# Workshop chrome presentation

Maintain the workshop's navigation, toolbar, preview frame and controls without
restyling specimens or changing story/session behavior. Decision #109 owns the
custom adaptive shell; this presentation pass keeps its platform boundaries.

## Reference and identity

Use Storybook's separation of sidebar, toolbar, canvas and addon panel as a
hierarchy reference, adapted to Octane's neutral surfaces and existing tokens.
See the official [UI layout documentation](https://storybook.js.org/docs/configure/user-interface/features-and-behavior)
and [layout source](https://github.com/storybookjs/storybook/blob/next/code/core/src/manager-api/modules/layout.ts).
No Storybook manager runtime, assets or branding are introduced. The existing
portable composition dependency is unchanged.

## Presentation boundaries

- Web chrome uses local `--xw-*` aliases over existing `--color-*` tokens, with
  light/dark fallbacks. System preference and ancestor `.dark`/`.ns-dark` or `.light`/`.ns-light` work
  without requiring an app stylesheet. App tokens take precedence.
- Form colors and focus selectors target chrome classes, never arbitrary
  specimen inputs. The stage slot retains its original default colors; explicit
  preview background and bounds still belong to the existing environment UI.
- The web toolbar wraps at narrow widths; panel content scrolls independently.
  Selected navigation has an inset marker as well as a background change.
- Native targets (iOS/Android, macOS, Linux) render ONE shared chrome —
  `packages/workshop/src/native/chrome.tsrx` — styled by one
  NativeScript-dialect stylesheet (`src/native/chrome.css`, `xw-*` class
  selectors only). The NativeScript renderer, the AppKit renderer
  (`@octane-xplat/macos-renderer`), and the GTK renderer
  (`@octane-xplat/linux-gtk`) each mount it as their own root; the story
  mounts in a second renderer root inside a chrome-owned `masonview` stage
  slot, so chrome re-renders never detach the story. Hosts keep only
  window/page lifecycle, key routing (Escape overlays), and the WORKSHOP_*
  automation protocol.
- Mode breakpoints in the native chrome: wide `width >= 1000 && height >=
  480` (collapsible catalog/stage/controls columns), compact (open panel sits
  beside the stage at 45%), phone `width <= 600` (panel is an absolute
  `inset:0` overlay above a `visibility:hidden` stage).
- Inherited CSS properties (color/font) never sit on `.xw-root`/`.xw-stage*`
  ancestors — NativeScript would leak them into the story root.
- Chrome introduces no animations or transitions, including under reduced
  motion. Story animations remain under the specimen's control.

## Verification boundary

The maintained web journey checks computed colors/contrast, hover, keyboard
focus, selection, disabled controls, theme isolation, reduced motion and toolbar
geometry at 320, 390, 640 and 800 pixels, alongside the existing story behavior
checks. The packed consumer runs the same journey. No image evidence is needed.
Native source/type/build checks do not prove OS focus, hit-testing, theme changes
or visual parity. Keep actual-host and screen-reader/IME gates explicit.

Run these checks from the repository root after changing chrome. The browser
journey uses DOM, input and computed styles without capturing images; the
packed mobile check compiles consumer entries without launching a device.

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/workshop
pnpm --filter @octane-xplat/workshop test
pnpm --filter @xplat/workshop-demo test:e2e
pnpm --filter @xplat/workshop-demo test:e2e:macos
pnpm --filter @xplat/workshop-demo test:e2e:gtk
pnpm --filter @octane-xplat/workshop test:packed
pnpm --filter @octane-xplat/workshop test:packed:macos
pnpm --filter @octane-xplat/workshop test:packed:linux
pnpm --filter @octane-xplat/workshop test:packed:mobile
pnpm check:recipes
pnpm check:css
```
