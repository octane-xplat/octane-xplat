# Changelog

## 0.5.0

Everything added, changed, and fixed since 0.4.0.

### New components and hooks

- **`<Hoverable>`** — a delayed hover card anchored to its child. On
  iOS/Android the same card opens from a long press (native has no
  hover), using the driver's long-press recognizer for intent. On web
  the card stays alive while the pointer crosses from the anchor onto
  the card itself.
- **`useMeasure()`** — live element bounds:
  `const { bind, bounds } = useMeasure()`, then pass `bind` to any
  primitive's `bind` prop. Bounds are observed by default (`null` until
  first layout); `{ observe: false }` for a one-shot read. Web
  coordinates are viewport-relative; native are screen-relative dips.
- **Anchored toasts.** `showToast()` accepts `anchor` + `placement` to
  position a toast from a view, in addition to the existing
  top/bottom + start/end viewport placements.
- **`cardClassName`/`cardStyle`** on `Hoverable` (and card internals)
  style the overlay wrapper directly — no more compensating CSS on the
  card content.
- **`PanEvent`/`SwipeEvent` types** are now exported from the package
  entry points (previously declared but unreachable).

### Theming and styling

- **DOM normalization in `tokens.css`.** `box-sizing: border-box` and
  `border-width: 0; border-style: solid` defaults bring web in line with
  NativeScript's box model — a lone `border-width` now paints the same
  way on both platforms instead of needing a paired `border-style`.
- **Utility fixes.** `.flex-1` emits `flex: 1 1 0%`; `items-start` is
  available; `--color-onprimary` replaces `--color-on-primary` (the
  rename keeps the utilities drop-in compatible with Tailwind v4's
  token-key rule).
- **Status-bar icons follow the theme.** Switching to dark mode flips
  status-bar icon appearance on iOS and Android from first paint —
  previously Android kept its launch-time appearance.
- `openUrl`-style anchors and inputs pick up muted placeholder text and
  consistent focus styling on web.

### Icons

- `Icon` documents and enforces a clear fallback order —
  SVG (`markup`/`svg`/`src`) → `font` glyph → `text` — and preserves
  `viewBox` for multi-path SVG artwork on web.

### Toolchain

- **`xplat doctor` warns on undeclared native plugins.** If a shipped
  plugin (like the gesture handler `Drawer` eager-loads) isn't in your
  app's `package.json`, you get a warning at dev time instead of a boot
  crash on device.
- **`xplatNative()` fixes.** The preset seeds `alien-signals` into the
  deps bundle (fixes 504s when dev-serving) and teaches rolldown that
  `.tsrx` files contain JSX (fixes dev/HMR transforms).
- **Starter updates.** `create-octane-xplat` now declares
  `cli.packageManager: 'pnpm'` (required for symlinked installs to
  resolve under `ns build`) and ships a `.agents/skills/xplat` skill +
  `AGENTS.md` so coding agents get the platform rules on demand.

### Fixed

- **Android cold-launch crash** in `appInfo` — reading the app context
  at module load crashed inlined-bundle boots; it now reads lazily.
- **Accessibility props wired on native.** `accessible`, label, hint,
  value, role, state, and live-region props on `Pressable`/`Text` reach
  the platform accessibility APIs (role names are translated, e.g.
  `heading` → `header`).
- **Pan velocity on native.** `PanEvent` velocity is now reported in
  dips/second on iOS (`velocityInView`) and Android (`VelocityTracker`).
- **`TextArea` submit.** `onSubmit` on native fires only for
  `returnKeyType="done"`/`"send"` — it no longer fires on every newline.
- **`useAnimation` honors `prop` on web** — it no longer always writes
  `translateX` regardless of the requested property.
- **Overscroll containment** on web — nested scroll containers no longer
  chain into the app column or the browser's pull-to-refresh.
- Web multiline input echo preserves newlines; `<Text>` placeholders
  render in the muted text color.

### Upgrading

- **New peer dependency for `<Drawer>`:** declare
  `@nativescript-community/gesturehandler` in your app's `package.json`
  if you use `Drawer` — the drawer eager-loads it and NativeScript only
  compiles plugins that are top-level declarations. `xplat doctor`
  flags this if it's missing.
- **`--color-on-primary` is now `--color-onprimary`** — rename the
  variable in app stylesheets if you referenced it directly.
- Web borders on shared components now paint from `border-width` alone
  (the DOM normalization above); if your app relied on the old
  no-border-unless-`border-style` behavior, audit shared rules that set
  a bare `border-width`.

## 0.4.0

Everything added, changed, and fixed since 0.3.0.

### Navigation and routing

- **Layouts.** A `_layout.tsrx` file wraps every route in its folder and
  subfolders, so shared chrome (headers, banners, sidebars) lives in one
  place instead of being repeated in each screen.
- **Modal and fade routes.** Name a route file `settings+modal.tsrx` or
  `photos+fade.tsrx` and it opens as a modal or with a fade transition.
  Modal routes get their own layer on both platforms and can be closed
  with `popRoute()`.
- **Route loaders.** Export `loader(params)` from a route file and it
  runs just before navigation, so the screen opens with data already on
  the way. The result reaches the screen as `data` (or `error`) props.
- **Deep links.** `pushDeepLink(url)` turns an incoming URL into an
  in-app navigation. Feed it links with `onDeepLink()` and
  `consumeInitialUrl()` from `@octane-xplat/platform` at app start.
- **Per-tab history.** Give a tab `stack: 'name'` and it keeps its own
  back stack — pushing a route while that tab is active opens the screen
  inside the tab, and switching tabs keeps each stack's history.
- **Typed routes, no boilerplate.** `xplat routes` scans your route
  folder and generates typed route names, params, and presentations.
  `xplat dev` and `xplat build` regenerate automatically, and apps no
  longer write a route manifest by hand.
- **Scroll restore on web.** Navigating back or forward returns each
  page to its previous scroll position.
- **`openWindow()`** opens a second window — a browser window on web, an
  extra app window on native.
- **Route guards.** Export `beforeLoad({params, context})` from a route
  file and it runs before a push commits. Return an object and it merges
  into the screen's props and route context; `redirect(route)` short-
  circuits to another route.
- **Route `head`.** Export `head` as `{title, meta}` (or a synchronous
  params function). Web writes `<title>`/meta tags; native uses `title`
  for the pushed page's action bar.
- **Back-state hooks.** `useCanGoBack(stack?)` tracks in-app history depth
  on web and `Frame.canGoBack()` on native; pushed screens also get
  `_pushed`/`_stack` props.
- New exports: `currentModalRoute`, `useModalRoute`, `routeStacks`,
  `pushDeepLink`.

### New components

- **`<Sheet>`** — a bottom sheet docked inside the current window.
  Declarative (`<Sheet open onDismiss={...}>`) or imperative
  (`openSheet(Component, params)` / `closeSheet()`). The existing
  `Modal presentation="sheet"` remains for a full system modal.
- **`<Link>`** — a link to an external URL. A real `<a href>` on web;
  opens the system browser on native.
- **`<NavLink>`** — a link to an in-app route, with an
  `activeClassName` that applies while that route is current.
- **`<Meter>`** — a circular progress ring.
- **`<Drawer>`** — a real slide-out drawer on native (powered by
  `@nativescript-community/ui-drawer`), matching the web drawer. Pass
  content as elements: `<Drawer main={<Home />} drawer={<Menu />}>`.
- **`<RichText>` + `<RichTextSpan>`** — mixed inline formatting and
  tappable runs: `<RichText><RichTextSpan text="Read " />
<RichTextSpan className="link" onPress={...} text="@alec" /></RichText>`.
  Inline spans on web; one label with styled/tappable spans on native.
- **`<Popover>` now works on native.** It opens an overlay anchored to
  its trigger. Previously it rendered nothing off-web.
- **Richer `<Icon>`** — registered icons can carry full SVG artwork
  (`markup` + `viewBox` for multi-path icons) or a unicode `text`
  fallback.
- **SVG images on native.** `<Image>` and `<Icon>` render `.svg` files,
  SVG data URIs, and inline SVG markup on iOS/Android.
- **Liquid Glass.** `<LiquidGlass>` is an interactive glass surface and
  `<LiquidGlassContainer>` merges neighboring glass surfaces. Real iOS 26
  material where available, a `backdrop-filter` approximation on web, and
  a plain view everywhere else. Container components (`View`, `Row`,
  `Grid`, `Stack`, `Absolute`, `Pressable`, `ScrollView`) also take a
  `glass` prop — `glass` or `glass="clear"` for static background glass.

### Layout and styling

- **Flex props on containers.** `View`, `Row`, and `Pressable` accept
  `justifyContent`, `alignItems`, `flexWrap`, and `gap` — the same names
  React Native uses. `justifyContent="space-between"` replaces
  `margin-left: auto`, which native ignores.
- **`id` on every component.** Forwarded to the host element on both
  platforms, for test selectors and debugging.
- **New utility classes.** `min-w-0`, `min-h-0`, `shrink-0`, and `grow`
  cover the common flexbox overflow guards.
- **Automatic px→dip.** Pixels in shared stylesheets convert to
  device-independent units in the native build, so one stylesheet sizes
  correctly on both platforms.
- **Smooth (squircle) corners.** `corner-shape: squircle` is the default
  corner treatment — the `.rounded-sm/md/lg/xl` utilities and the shipped
  component classes (modals, sheets, inputs, chips) declare it, and a
  `--radius-*` token scale backs them. iOS uses the system's continuous
  corner curve; web needs Chrome ≥139, other browsers fall back to round.
  `.rounded-full` stays a real circle; opt out per element with
  `corner-shape: round`.
- **`<ScrollBox>`** — wraps content that may contain a `<List>`. On web it
  scrolls like `ScrollView`; on native it's a plain inline view so the
  `ListView` owns scrolling. (A `List` nested inside a native `ScrollView`
  can't measure its cells — it now throws a named error instead of
  crashing inside UIKit.)

### Theming

- **App-wide light/dark control.** `setThemePreference('light' | 'dark'
| 'system')` and `useThemeScheme()` manage the theme. Overlays,
  popovers, toasts, sheets, modals, and web portals now follow it —
  previously only the app root did.

### Platform services (`@octane-xplat/platform`)

- `clipboard.canCopy()` and `clipboard.writeText()` on both platforms.
- `media` image picking returns a `PickedImage` with a `previewUri` and
  `dataUrl` that persist and render on both platforms; the native
  `<Image>` component accepts base64 data URIs.
- `geolocation.getCurrentPosition()` returns the platform-neutral
  position shape (`latitude`, `longitude`, `accuracy`, …) on both
  platforms.
- `connectivity.getState()` / `connectivity.subscribe()` report online
  status and connection type, with change events on both platforms.
- `appInfo` (`version`, `build`, `bundleId`) on native; reports
  `supported: false` on web where no trustworthy values exist.
- `openUrl(url)` opens a link in the system browser (or a new tab on
  web); `openSettings` jumps to the app's native settings page.
- Deep links on native are more reliable: links that launched the app
  are delivered, and duplicate deliveries are dropped.
- `SafeArea` on Android now reads system-bar and display-cutout insets
  and keeps them updated; web `biometrics` reports `unsupported`
  honestly instead of pretending WebAuthn works.

### Toolchain (`@octane-xplat/cli`)

- **`xplatNative()` Vite preset.** One call replaces the ~130-line
  `vite.config.native.mts` boilerplate — renderer setup, platform file
  resolution, and the dev-mode HMR watchdog are built in. Import from
  `@octane-xplat/cli/vite`.
- **Native CSS checks.** The build warns when a stylesheet uses
  declarations NativeScript ignores (`position: fixed`, `z-index`,
  `box-shadow`, auto margins, and friends) and suggests the portable
  alternative. Blocks marked web-only are stripped from the native
  bundle.
- **`@octane-xplat/lint`.** A new lint package (run with `xplat-lint`)
  that catches cross-platform mistakes at lint time instead of letting
  them fail silently on device — DOM globals in shared files, web-only
  APIs, NativeScript imports in shared code, style properties native
  ignores, unitless `lineHeight`, hooks in plain `.ts` files, and more.
  It lints `.tsrx` files too, and `--fix` applies supported fixes. New
  projects created with `create-octane-xplat` get it preconfigured.

### State and reactivity

- **Signal reads work on native.** Reading a module-level
  `signal$`/`query$` with `.get()` inside a component now subscribes and
  re-renders on iOS/Android, same as on web — no extra plumbing needed
  for shared state.
- **`@else if` works on native**, returning the matching branch's UI.
- **JSX in props works on native.** `<Drawer main={<Home />} />` and
  similar element-valued props previously threw; they now render.

### Fixed

- `popRoute()` reliably closes modal routes on iOS — it could previously
  leave the modal visible when animations raced.
- Popovers, toasts, sheets, and overlays opened from a pushed page now
  appear on that page instead of attaching to the wrong window root.
- `<Text>` wraps by default on native; it was silently rendering
  single-line and truncating. `ellipsize` or `numberOfLines={1}` opt
  back in.
- `style={{ lineHeight: 40 }}` now means 40px on web — it rendered
  roughly 40× too tall.
- Classes can override `Pressable`'s default column direction on native;
  a `flex-direction: row` class was previously ignored.
- `Icon` artwork set via `markup` respects the `color` prop, and the
  popover backdrop color renders correctly.
- Omitted optional props no longer reach native views as `undefined` —
  a `TextInput` without `editable` could previously come out
  non-interactive (tappable-looking field that could never take focus).
- Native `Screen` children can no longer silently overlap and eat each
  other's taps — sibling views used to share the screen's full bounds,
  so an invisible covering area could make buttons look dead.
- Type fixes so consumer apps typecheck cleanly (`Meter`'s `onDraw`,
  the media picker).

### Upgrading

- New native peer dependencies: `@nativescript-community/ui-svg`
  (SVG icons/images), `@nativescript-community/ui-canvas` (`<Meter>`),
  and — only if you use `<Drawer>` —
  `@nativescript-community/ui-drawer`.
- The bundled Octane runtime moved to 0.5.0.
- Watch for screens that relied on single-line text: `<Text>` now wraps
  on native by default.
- If your app uses pnpm, declare `cli.packageManager = 'pnpm'` in
  `nativescript.config.ts` — otherwise `ns build` can fail to resolve
  symlinked packages.
- `List`'s `kindFor` prop is removed — branch on the item inside
  `renderItem` when row markup differs.
- Move any `List` nested in `ScrollView` over to `ScrollBox` — native
  now throws on that shape (see above).
- Corners look subtly smoother where you use the shipped radius classes;
  elements that must keep circular corners can opt out with
  `corner-shape: round`.
- Existing apps can opt into the lint rules with
  `pnpm add -D @octane-xplat/lint oxlint` — setup steps are in the
  package README.
