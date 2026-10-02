# Changelog

## [0.8.0] - 2026-10-02

### Breaking Changes

- *(share)* [**breaking**] Extract @octane-xplat/share leaf from @octane-xplat/platform
- *(platform)* [**breaking**] Extract all plugin-backed services into leaf packages

### Features

- *(cli)* Ship scaffold patches as config dependency
- *(date-picker)* Port Expo's DatePicker/TimePicker into platform leaves
- *(context-menu)* Port Expo's ContextMenu/DropdownMenu into platform leaves
- *(sheet)* Port Expo's BottomSheet/ModalBottomSheet into platform leaves
- *(auth)* Add @octane-xplat/auth — Sign in with Apple + Google Sign-In
- *(auth)* Implement Sign in with Apple + authSession on macOS
- *(platform)* Add macOS share sheet support
- *(effects)* Ship shader registration inside the leaf
- *(push)* Add @octane-xplat/push leaf — Firebase Cloud Messaging on all targets
- *(sqlite)* Add @octane-xplat/sqlite leaf for cross-target persistence
- *(sqlite)* Run sqlite-wasm in-process on macOS
- *(sqlite)* Bind system libsqlite3 on macOS via host metadata interop
- *(context-menu)* Add the AppKit leaf
- *(date-picker)* Add the AppKit leaf
- *(sheet)* Add the AppKit leaf
- *(ui)* Typed programmatic routes via literal-path inference
- *(cli)* Fail builds on platform-boundary module leaks
- *(ui,cli)* Baked dataMode — route loaders that run at codegen
- *(ui,cli)* Markdown files as baked routes
- *(ui,cli)* Normalized JSON route manifest for external hosts
- *(sqlite)* Run sqlite-wasm in-process on macOS
- *(sqlite)* Bind system libsqlite3 on macOS via host metadata interop
- *(cli)* Compile macOS leaf sources and generate app metadata
- *(cli)* Integrate macOS native leaves into dev and packaged apps
- *(bridge)* Add typed desktop host contracts and macOS proof
- *(macos)* Add system webview desktop backend
- *(lottie)* Add @octane-xplat/lottie leaf package
- *(lottie)* Vendor the ui-lottie fork inside the leaf
- *(cli)* Add Linux WebKitGTK app packaging
- Persist the selected color scheme
- Add isolated platform probe runner
- *(cli)* Define process.env.NODE_ENV at the bundler level
- *(bamboo)* Integrate portable CSS utilities
- *(richtext)* Add @octane-xplat/richtext leaf with Android Aztec editor
- *(tiptap)* Add @octane-xplat/tiptap unified editor facade
- *(lingui)* Add @octane-xplat/lingui leaf package

### Bug Fixes

- *(ui)* Preserve web pan gestures through rerenders
- *(leaves)* Point export types at the platform barrel, not types.ts
- *(context-menu)* Create the Android trigger host with a real Context
- *(macos)* Converge deep seeks — suppress corrections mid-seek, docH-free offset
- *(ui)* Preserve native pan cancellation
- *(cli)* Resolve app imports lazily in xplatNative
- *(ui)* Share KeyboardAvoiding root API
- *(audio)* Repair iOS system playback controls
- *(app)* Correct navigation parity and media probe usage
- *(manifests)* Remove rebase conflict markers
- *(platform)* Build the auth-session anchor class lazily
- *(data)* Preserve query ownership and native suspense events
- *(cli)* Probe the .mobile suffix tier in the ns-vite type check
- *(ui)* Emit web-variant declarations and fix the packed consumer
- *(ui)* Retain prepared routes across browser history
- *(navigation)* Handle malformed and repeated incoming links
- *(ui)* Unmount route roots when native modals dismiss
- *(ui)* Prevent controlled native text echoes and release editing focus
- *(ui)* Support keyboard actions and prevent disabled activation
- *(ui)* Convert Android keyboard insets to layout units
- *(ui)* Contain and restore focus for shaded web overlays
- *(typecheck)* Exclude platform directories from the mobile program
- *(create)* Ship a starter that installs and lints cleanly
- *(ui)* Keep the phantom route key out of the published value surface
- *(cli)* Report unresolvable patches as not-applicable
- *(lint)* Correct rule scopes and clear the violation backlog
- *(ui)* Preserve VirtualList visible anchor on web data updates
- *(ui)* Prevent stale route loads from overriding navigation
- *(ui)* Release native overlay hosts and theme subscriptions
- *(ui)* Cancel long presses when their interaction ends
- *(ui)* Keep PIN edits in their intended cells
- *(ui)* Grow uncontrolled textareas as users type
- *(ui)* Tolerate navigation events without a payload
- *(ui)* Unblock typegen by narrowing restored route state
- *(patches)* Carry upstream runtime fixes
- *(platform)* Settle hosted auth sessions safely on failure and retry
- *(media)* Clean up temporary previews when image conversion fails
- *(audio)* Release browser sound voices and system controls on teardown
- *(cli)* Resolve builtin-named deps in the macOS native scan
- *(macos)* Repair the dev bundle against main drift
- *(cli)* Refresh NativeScript Vite patch at 8.0.17
- *(leaves)* Resolve packed declaration specifiers under NodeNext
- *(sqlite)* Import SqliteParam in the macOS database backend
- Restore Android development startup and native JSX types
- *(ui)* Reduce VirtualList scroll and measurement work
- *(ui)* Restore generated web barrel for platform-leaf resolution
- *(ui)* Declare Markdown exports on the macOS type surface
- *(ui,lottie)* Rewrite vendored specifiers to the emitted paths
- *(tiptap)* Keep upstream's bare process.env read in the @octanejs/tiptap patch
- *(richtext,tiptap)* Emit types.d.ts from src/types.ts
- *(create)* Tolerate unused framework patches in scaffolded apps

### Performance

- *(ui)* Recycle and position VirtualList cells

### Refactoring

- *(web)* Share desktop host services across webview backends

## [0.7.3] - 2026-09-30

### Bug Fixes

- _(platform)_ Create auth anchor with runtime extension
- _(ui)_ Align native stack children
- _(ui)_ Align native slider measurements
- _(ui)_ Honor variable font weight on iOS
- _(ui)_ Preserve explicit native text line heights
- _(ui)_ Size native command palette to viewport
- _(ui)_ Render native pagination pages
- _(ui)_ Keep checkbox glyph on contrast color
- _(ui)_ Align native text utility line boxes
- _(native)_ Restore workspace CSS bridge
- _(android)_ Apply custom font weights
- _(ui)_ Guard native WebView scroll handling
- _(ui)_ Position native popovers inside safe area
- _(ui)_ Auto-place unpositioned grid children
- _(ui)_ Isolate iOS tap blur bridge code by platform

## [0.7.2] - 2026-09-29

### Bug Fixes

- _(ui)_ Make the shared barrel extensionless

## [0.7.1] - 2026-09-29

### Bug Fixes

- _(macos)_ Converge VirtualList measurements instead of oscillating
- _(ui)_ Restore web-specific entry implementations

### Refactoring

- _(ui)_ Share web declarations with common API

## [0.7.0] - 2026-09-29

### Breaking Changes

- _(ui)_ [**breaking**] Make ui-svg a transitive plugin dependency
- _(ui)_ [**breaking**] Draw Meter on svgview, drop the ui-canvas peer
- _(ui)_ [**breaking**] Vendor ui-svg's SVGView, dropping the ui-canvas merge

### Features

- _(cli)_ Add experimental macOS AppKit target
- _(cli)_ Own experimental macOS packaging
- _(canvas)_ @octane-xplat/canvas — DOM Canvas API incl. WebGPU/WGSL
- _(effects)_ @octane-xplat/effects — platform view-effect shaders
- _(camera)_ Replace camera-plus with camera preview leaf
- _(media)_ Add optional haptics sound and audio services
- _(ui)_ Add shared VirtualList vertical foundation
- _(macos)_ Package optional app icon
- _(ui)_ Expose the supported macOS root surface
- _(ui)_ Add AppKit leaves for the shared harness surface
- _(macos)_ Run the xplat harness on AppKit
- _(macos)_ Run shared harness on AppKit
- _(macos)_ Add core web parity baseline
- _(pager)_ Extract Pager into @octane-xplat/pager
- _(video)_ Extract Video into @octane-xplat/video
- _(linux)_ Experimental WebKitGTK webview target with host bridge
- _(cli)_ Ship canonical patch set + xplat patches apply/check
- _(linux)_ Verify gjs host under real WebKitGTK in container
- _(macos)_ Make JavaScriptCore the packaged AppKit host
- _(macos)_ Run dev HMR in JavaScriptCore
- _(platform)_ Add webAuthn + authSession capabilities for passkey/auth ceremonies
- _(ui)_ Add programmatic route registration (defineRoutes/addRoutes)
- _(cli)_ Port NativeScript#11446 nested-tab-frame fix into the core patch
- _(ui)_ Add native UI affordances
- _(linux)_ Host-backed appearance, file picker, and deep links
- _(linux)_ Multi-window via host windows
- _(windows)_ Scaffold apps/windows on the upstream core platform
- _(ui)_ Port shared component leaves to the AppKit host
- _(macos)_ Populate the __xplatAppKit platform-services seam
- _(ui)_ Share Hoverable/Tooltip as passthrough leaves, add macOS hover
- _(ui)_ Impl in unsuffixed leaf, .mobile as passthrough
- _(native-picker)_ Add cross-platform native picker pilot
- _(motion)_ Add cross-platform declarative motion and values
- _(motion)_ Retain live subtrees through exit animations
- _(typegen)_ Verify published package declarations
- _(ui)_ Generate declarations with tsrx-typegen
- _(cli)_ Patch @nativescript/vite deps-bundle to alias octane
- _(windows)_ Port framework patch set to @11468 preview builds
- _(ui)_ Split shared and platform entry barrels
- _(macos)_ Windowed VirtualList and shared 5000-row benchmark on the AppKit host
- _(picker)_ Expose platform-specific controls

### Bug Fixes

- _(cli)_ Resolve package metadata rebase conflict
- _(cli)_ Probe codesign with a valid command
- _(canvas)_ Narrow width/height cast for the native view prop types
- _(canvas)_ Align with current NativeScript runtime
- _(ios)_ Resolve Swift target compile errors
- _(ios)_ Initialize SwiftUI view factory before registration
- _(lint)_ Allow the macOS Node-API runtime
- _(ui)_ Type openWindow results by target
- _(macos)_ Preserve previous package artifacts on publish failure
- _(macos)_ Place runtime framework in bundle framework directory
- _(cli)_ Replace macOS SEA packaging
- _(macos)_ Bundle supported LTS runtime
- _(macos)_ Pin bundled Node archive checksum
- _(cli)_ Validate installed macOS runtime layout
- _(cli)_ Preflight macOS runtime before bundling
- _(macos)_ Complete framework links before signing
- _(macos)_ Preserve framework-relative symlinks
- _(macos)_ Use defined runtime package name
- _(macos)_ Verify cached Node runtime binary
- _(macos)_ Complete framework links before signing
- _(ui)_ Honor Android safe area insets
- _(macos)_ Align shared control geometry
- _(macos)_ Match shared slider geometry
- _(macos)_ Match Stack overlay layout
- _(macos)_ Match shared text and heading metrics
- _(macos)_ Align textarea row sizing
- _(macos)_ Honor Pressable alignment props
- _(macos)_ Expand flexible stack children
- _(cli)_ Pin dep-optimizer surface in native dev preset
- _(patches)_ Route /@fs and re-export specifiers through /ns/m
- _(macos)_ Reject unsupported host API members during packaging
- _(ui)_ Named-stack pushes work on Android tab panes and pop past the iOS isLoaded stall
- _(native)_ Serve pnpm-isolated deps and device-safe CSS/CJS over /ns/m
- _(native)_ Keep sheets above the keyboard, tap-to-blur, and guard optional bridges
- _(platform,ui)_ Make link:-consumed source device-safe on native
- _(ui)_ Keep nested Tabs from re-presenting an ancestor's stack
- _(ui)_ Cover ListItem on the AppKit host
- Restore native parity harness
- _(parity)_ Align shared heading typography
- _(ui)_ Apply NativeScript SVGView decorator without syntax transform
- _(ui)_ Emit octane/universal-native specifiers in native lib builds
- _(create)_ Bump template pins to ui/cli ^0.6.0 + octane 0.6.3
- _(patches)_ Make Octane install independent of research
- _(ui)_ Keep popover className off the native full-screen host
- _(lint)_ Add node shebang to xplat-lint bin
- _(cli)_ Probe the .mobile suffix tier in ns-vite tsconfig-paths resolution

### Refactoring

- _(platform)_ Use native default and mobile suffix

## 0.6.0

Everything added, changed, and fixed since 0.5.0.

### Components and interaction

- New shared components for forms, menus, navigation, and data display:
  `Button`, `Accordion`, `Checkbox`, `Select`, `InputTags`, `InputRating`,
  `Breadcrumb`, `Pagination`, `Stepper`, `Table`, `Timeline`, `Tree`, and
  related primitives.
- `Pager`, `SegmentedControl`, and `SearchInput` provide shared controls for
  paging, choosing among options, and searching.
- Web apps can use the accessible `Tooltip` component from
  `@octane-xplat/ui/web`.
- `ScrollView` supports pull-to-refresh with `refreshing` and `onRefresh`.
  Sheets accept detents for snap-point layouts.
- `WebView`, `Video`, and `CameraView` provide hosted web, playback, and live
  camera surfaces. `@octane-xplat/gif` adds `AnimatedImage` for animated GIF
  and WebP files.
- `setTranslate()` applies an imperative translation consistently across
  targets. `useBackInterceptor()` lets a screen handle native hardware back.

### Platform services and toolchain

- `@octane-xplat/platform` adds reactive `useBreakpoints$()` and camera capture
  through `media.capturePhoto()`.
- The CLI improves NativeScript dependency discovery, CSS unit conversion and
  web-only CSS handling, and native plugin diagnostics. `xplatNative()` and
  route generation also receive fixes.
- The starter template now includes an agent skill with the cross-platform
  rules and component guidance.

### Upgrading

- The shared UI surface now favors components with matching behavior across
  platforms. `List`, `Modal`, `Hoverable`, and Liquid Glass are no longer root
  exports; platform-authentic widgets are available from `@octane-xplat/ui/ios`
  or `@octane-xplat/ui/android` where supported. Check the platform subpath
  guide when migrating those imports.
- Apps using `<Video>` or `<CameraView>` must declare their corresponding
  NativeScript plugin dependencies: `@nstudio/nativescript-exoplayer` and
  `@nstudio/nativescript-camera-plus`.
- `useBreakpoints` was renamed to `useBreakpoints$` to identify its reactive
  return value.

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
