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

- Both shells use a compact toolbar, a story tree with short leaf names, a
  breadcrumb and title above the framed preview, and a controls inspector with
  properties before preview settings. Full story IDs remain searchable and
  available through accessible labels/tooltips or host details. Empty search
  results explain how to recover.
- Native chrome actions use interactive `masonview` hosts with explicit button
  roles, names, disabled/selected/expanded states and pressed feedback. This
  avoids platform button bezels while retaining the renderer's activation and
  accessibility path. Desktop actions are at least 32 points high; iOS/Android
  actions and inputs are at least 44. Host qualification and launch details live
  in the inspector's collapsed **Host details** section; failures and stale
  state remain visible beside the preview. GTK still drops accessible state
  and live-region props, and `onTouch` is unwired there; see the
  [GTK limitations](notes/linux-gtk-renderer.md#gjsgtk-stand-ins-found-during-the-workshop-gtk-cutover).
  Assigning these props does not qualify assistive-technology behavior.
- The shell keeps its small native intrinsic vocabulary. Importing the UI root
  barrel for `Pressable` in the AppKit shell build pulled unrelated table hooks
  into universal compilation and failed with “JSX in an unsupported module
  declaration” (Octane 0.14.0, table row-index/expansion/status/tree/group hooks).
  The local chrome action uses the same interactive container contract without
  importing that barrel. The chrome bundle compiles; the separate demo stories
  bundle still reaches the same table hooks and fails. This does not qualify
  the full UI barrel on AppKit.
- NativeScript's stylesheet registry drops `display` and cannot express
  `position`, `inset` or `flex-basis`. The shell keeps Mason's layout mode and
  overlay geometry in the element style channel (four explicit edge offsets;
  AppKit ignores the `inset` shorthand), and supported static styles
  in `chrome.css`. This is a stylesheet boundary, not a CSS-engine fix.
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
- Keep the native preview containers keyed and mounted as surrounding chrome
  changes. Stage-only hides the preview heading with `display: none` instead
  of removing its sibling slot. Session identity alone cannot detect a detached
  native stage: verification must interact with the story after returning.
- Mode breakpoints in the native chrome: wide `width >= 1000 && height >=
  480` (collapsible catalog/stage/controls columns), compact (open panel sits
  beside the stage at 45%), phone `width <= 600` (panel is an absolute
  four-edge overlay above a stage with `visibility="hidden"`).
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
bun run turbo run typecheck --filter=...@octane-xplat/workshop
bun run turbo run test --filter=@octane-xplat/workshop
bun run turbo run test:e2e --filter=@xplat/workshop-demo
bun run turbo run test:e2e:macos --filter=@xplat/workshop-demo
bun run turbo run test:e2e:gtk --filter=@xplat/workshop-demo
bun run turbo run test:packed:mobile --filter=@octane-xplat/workshop
bun run check:recipes
bun run check:css
```

The native journey's `chrome-press <accessible label>` command dispatches the
rendered chrome's recognizer action (or GTK activation). It checks panel close
and reopen, stage-only return and Unset through those actions, independently
of direct controller commands. This is handler dispatch, not OS input or
hit-testing. Browser checks use DOM geometry and computed styles; neither
journey establishes visual parity without separate visual review.
