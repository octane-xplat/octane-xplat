# Docs UI and host boundaries

The docs presentation uses shared `@octane-xplat/ui` components: `Heading`,
`Text`, `Link`/`NavLink`, `Image`, `Icon`, `Table`, `ScrollableArea`, and
`DropdownMenu`. Keep application markup out of browser intrinsics and platform
escape bags. Compose shared components when the docs need a custom surface.

Heading sizes, weights, and leading belong to `docs-theme.ts`; the compact
theme follows the same 1100px breakpoint as the navigation. Keep spacing and
decoration in `style.css`. The shared theme preference also controls portalled
menus, so the docs toggle must update `setThemePreference`.

## Remaining browser integration

Shared presentation does not qualify a native docs app. `docs-host.web.tsrx`
and `scroll.web.ts` preserve the existing browser behavior. They are explicit
host implementations, with no native fallback.

| Integration | Current boundary and remaining work |
| --- | --- |
| Demo readiness and retry | `WebView` owns embedding, loading errors, and the frame. Readiness travels over the shared `onMessage`/`postToHost` channel; the host validates the token, demo name, and ready type (origin check where the platform reports one). Native delivery is the poll-drained path (~200 ms) — same contract, no app change needed. |
| Section navigation and focus return | `ScrollableAreaHandle` supports logical offsets, but no named-descendant seek. `Pressable` has a host ref, but no portable focus handle. The host still resolves heading IDs and focuses the preview launch control. |
| Table edge fades | `useScrollableArea` exposes overflow state when owning the viewport, but `ScrollableArea` does not publish that state to a caller. The host observes the rendered viewport to preserve the existing fades. |
| Global search shortcuts | `useKeyboard` attaches to focusable platform hosts; shared `View`/`Pressable` do not forward those hardware-key props. The docs still need a window-level shortcut listener and palette focus/reset integration. |
| Sheet close animation | The existing controlled `BottomSheet` close unmounts immediately. The host preserves the docs' programmatic slide-out with DOM transforms before changing visibility. A shared animated-close contract would remove that workaround. |
| Constellation twinkling | The artwork is decomposed into 16 interleaved polygon-subset glyphs (`constellation-layers.ts`), rendered as stacked `Icon` layers inside `motion.View` hosts (`ConstellationMark.tsrx`). Each layer's opacity fade delegates to the platform animator through `useAnimate`; `useReducedMotion` gates the loop and an `IntersectionObserver` sentinel at the document top pauses it once scrolled. Individual polygons remain non-addressable — layers, not polygons, are the animation unit. |
| Markdown viewing and page URL | Opening generated text as a document still uses a browser object URL, and page actions read the current browser URL. URL opening and theme persistence use the existing platform services; their docs integration has not been qualified on a native target. |

`Text` supplies shared inline runs for highlighted phrases and prompt text.
There is no shared `mark` element or arbitrary HTML metadata contract; the
prompt no longer sets the browser-only `data-nosnippet` attribute. Do not add
web escape props to presentation components to conceal that gap.

## Verification

Use `turbo run typecheck --filter=...@xplat/docs`, the docs smoke task, and the
local responsive/browser checks. Check headings and anchors, modified link
activation, clipboard failure, menu keyboard dismissal, independent article
and sidebar scrolling, table overflow, and preview readiness/retry/focus.
Browser checks establish browser behavior only; no native docs host has been run.

Local Chromium and Firefox checks scrolled focused tables with ArrowRight.
Headless WebKit left the same focused viewport at offset zero; horizontal wheel
scrolling worked and updated the fades. That keyboard behavior remains a
qualification gap, recorded in local feedback `c8311e5c-a872-481a-8615-ec3c89ade68e`.
