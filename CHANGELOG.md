# Changelog

Selected features and breaking changes, newest release first. Bug fixes appear
in the [fixlog](FIXLOG.md). See the [glossary](GLOSSARY.md) for project-specific meanings.
Earlier releases retain their original combined notes; older independent
releases remain in the [tsrx-typegen changelog](packages/tsrx-typegen/CHANGELOG.md).

## [0.17.1] - 2026-10-23

### Bug Fixes

- *(native)* Preserve tab and list content across updates
- *(ui)* Size fixed mobile layers through CSS
- *(audio)* Ship the current Android command bridge

## [0.17.0] - 2026-10-23

### Breaking Changes

- *(ui)* [**breaking**] Replace ClassName with upstream ClassValue
- *(routing)* [**breaking**] Replace the routing API with a generated, typed router
- *(cli)* [**breaking**] Unify logs and native reports under diagnostics
- *(cli)* [**breaking**] Unify durable sessions and simplify launch selection
- *(scripts)* [**breaking**] Clarify task scope and remove duplicate work
- *(sqlite)* [**breaking**] Isolate asynchronous transaction ownership
- *(ui)* [**breaking**] Start Xplat-created native pages full-screen

### Features

- *(keyboard)* Synchronize host movement with keyboard transitions
- *(keyboard)* Track focused inputs and caret geometry
- *(keyboard)* Add focused-input-aware scrolling
- *(keyboard)* Add keyboard-sticky positioning
- *(chat)* Coordinate keyboard movement and message anchoring
- *(workshop)* Polish adaptive navigation and controls
- *(lint)* Detect routing migration mistakes
- *(create)* Teach canonical routing in the starter
- *(cli)* Retain development logs for agent reads
- *(platform)* Attach dev actions and effects from components
- *(dev-actions)* Return structured handler failures to agents
- *(dev-actions)* Resolve web failure stacks to source positions
- *(dev-actions)* Resolve NativeScript device stacks to source positions
- *(ui)* Keep the ChatLayout composer clear of the home indicator

### Bug Fixes

- *(ui)* Constrain native Screen width and preserve CSS Grid tracks
- *(keyboard)* Measure host overlap and avoid duplicate compensation
- *(keyboard)* Coordinate sheets and overlays with window avoidance
- *(keyboard)* Preserve Mason integration after rebase
- Finish migrating examples, tests, and docs off the removed layout tags
- *(camera,richtext,pager)* Repair style-only migration artifacts
- *(ui)* Allow classes to override native View direction
- *(cli)* Sync native prop resets and CSS cascade restoration
- *(cli)* Complete command discovery and contextual help
- *(ui)* Keep class name types compatible across renderers
- *(camera)* Admit onReady-triggered recording on Android (#35)
- *(cli)* Keep source-only deps out of the NativeScript HMR vendor bundle
- Publish JavaScript for Node-loaded configuration exports
- *(cli)* Allow installed linked source roots in native dev
- *(cli)* Discover native plugins in hook-linked workspaces
- *(native)* Keep class-sized Mason leaves and SVG ratios
- *(native)* Reach Mason's internal dirty setter on Android foreign leaves
- *(android)* Size width-only SVGs from their intrinsic ratio
- *(native)* Invalidate Mason layout for Android foreign leaves after style sync
- *(lib)* Emit route-pattern JavaScript during typegen
- *(bamboo)* Emit config JavaScript during typegen
- *(keyboard)* Align manifest with compatibility version
- *(ui)* Measure padded iOS LiquidGlass content inside its padding
- *(cli,lint,tsrx-typegen)* Run in-repo bins from source
- *(share)* Give the Android FileProvider a unique class name
- *(platform)* Find the dev-bridge token on NativeScript devices
- *(ui)* Load native images after the first layout, not after both axes (#36)
- *(ui)* Pick native srcset sources with one measured axis
- *(ui)* Request the post-load image layout on iOS only
- *(cli)* Retire released NativeScript Vite workarounds
- *(ui)* Drive native VirtualList through MasonKit's web scroll API
- *(native)* Use MasonKit's scroll API across native scroll consumers
- *(keyboard)* Treat MasonKit's Android scroller as a focus scroll owner
- *(ui)* Write native keyboard padding through MasonKit style
- *(ui)* Overlay the native ChatLayout dock in the scroller's grid cell
- *(ui)* Page the native Carousel on MasonKit
- *(ui)* Read MasonKit padding back as a Length when leasing it
- *(keyboard)* Scroll MasonKit's iOS scroller to the focused input
- *(shaders)* Patch shaders@4.0.0 regexes for ICU-less NativeScript V8
- *(ui)* Let classes override native component layout defaults
- *(cli)* Remove obsolete alien-signals native aliases
- *(ui)* Move web-inert native layout defaults into classes
- *(docs)* Fit articles and navigation on mobile
- *(cli)* Recognize aliased native default exports
- *(data)* Retire stale query cache operations
- *(auth)* Make sign-out supersede credential operations
- *(data)* Preserve collection integrity during updates
- *(ui)* Preserve modal ownership for child popovers
- *(routing)* Round-trip encoded static route segments
- *(ui)* Support keyboard operation of Slider
- *(cli)* Reject incomplete explicit build target selections
- *(cli)* Preserve shared native module identities during HMR
- *(auth)* Retire requests across hosted session changes
- *(recorder)* Keep web disposal terminal during startup
- *(files)* Reject native text write failures
- *(sqlite)* Await native version writes
- *(lingui)* Retain the latest locale activation
- *(lexical)* Normalize imported inline HTML at the root
- *(ui)* Keep fixed and custom layers inside their modal owner
- *(image)* Reset source ownership when the image host changes
- *(intersection-observer)* Subscribe to every view event
- *(motion)* Preserve translation when sampling web transforms
- *(lottie)* Read current playback intent when loading completes
- *(linux-gtk)* Include outer siblings in proxy child placement
- *(ui)* Avoid keyboard type cycles with platform suffixes
- *(ui)* Keep web bottom sheets within the viewport
- *(cli)* Enforce real-path boundaries for MCP code reads
- *(cli)* Preserve native plugin sources during clean
- *(workshop)* Confine asset reads to their real directory
- *(cli)* Preserve failed dev target exit statuses
- *(create)* Keep platform additions in the owning workspace
- *(image)* Align source selection before layout
- *(ui)* Mark full-screen page setup as mobile code
- *(macos)* Keep Mason layout in logical points during resize
- *(macos)* Resolve projected CSS placement before native layout

### Performance

- *(editors)* Build WKWebView documents without the Octane runtime

### Refactoring

- *(keyboard)* Centralize window state and subscription lifecycle
- *(ui)* Replace unnecessary as-any casts with typed helpers
- *(ui)* Narrow remaining as-any casts to typed reads
- *(ui)* Remove remaining unnecessary casts in primitives and tests

## [0.16.1] - 2026-10-20

### Bug Fixes

- *(ui)* Remeasure Android SVG after async source completion (#34)

## [0.16.0] - 2026-10-19

### Breaking Changes

- *(macos)* [**breaking**] All container intrinsics backed by Mason
- *(cli)* [**breaking**] Declare @triniwiz/nativescript-masonkit for octane apps
- *(leaves)* [**breaking**] Emit masonview + CSS props, drop layout aliases
- *(macos)* [**breaking**] Masonview is the only layout host intrinsic
- *(patch)* [**breaking**] Collapse mason registration to masonview + scrollview
- *(intrinsics)* [**breaking**] Masonview replaces the NS layout tag set
- *(ui)* [**breaking**] Emit mason style through the style prop via mergeStyle
- *(intrinsics)* [**breaking**] Masonview drops raw style keys
- *(patch)* [**breaking**] Style-only Mason keys + leaf-style routing
- *(macos)* [**breaking**] Style-only Mason keys on masonview
- *(leaves)* [**breaking**] Move mason style props into style
- *(ui)* [**breaking**] Move all intrinsic layout to the style channel
- *(packages)* [**breaking**] Leaf packages emit layout through style too
- *(driver)* [**breaking**] Remove the layout-prop channel from the octane patch
- *(macos)* [**breaking**] Style-only layout surface on the AppKit renderer
- *(jsx)* [**breaking**] Zero layout props on the shared intrinsic surface

### Features

- *(linux-gtk-renderer)* GTK4/GJS universal driver for native Linux widgets
- *(cli)* Register the .gtk platform suffix and xplatLinuxGtk preset
- *(linux-gtk-renderer)* Bind JSX surface to the shared @octane-xplat/jsx contract
- *(cli)* Add bundled lint command with optional fixes
- *(cli)* Manage framework dependency compatibility
- *(native)* Host custom-layout plugin containers in the octane driver patch
- *(macos)* Masonview backed by the Mason engine via mason-c
- *(macos)* @nativescript/core compat slice for plugin elements
- *(cli)* Register the GTK4/GJS runtime as a linux target
- *(create)* Keep app starters minimal with opt-in testing
- *(cli)* Resolve platform-specific CSS files
- *(cli)* Compile build-time platform CSS blocks
- *(bamboo)* Add build-time platform conditions
- *(cli)* Support comma-separated platform CSS targets
- *(native)* Container intrinsics backed by MasonKit on iOS/Android/Windows
- *(gtk)* Route style-bag layout keys into the Box shim
- *(gtk)* Bind mason-c via a GI typelib facade
- *(gtk)* Run masonview layout through the Mason engine

### Bug Fixes

- *(editors)* Use TypeScript browser asset build script
- *(linux-gtk-renderer)* Apply mount-time layout props and harden prop resets
- *(linux-gtk-renderer)* Reset layout/orientation props and resolve expand deep
- *(linux-gtk-renderer)* Write both expand axes when resolving flexGrow
- *(cli)* Use inlineDynamicImports for the single-file GJS bundle
- *(create)* Align scaffold JSX typing with shared facades
- *(create)* Raise Android template compile SDK to 36
- *(create)* Include app testing by default
- *(create)* Select DOM JSX types in starter web test
- *(cli)* Anchor native dev transforms to nested dependency files
- *(bamboo)* Reject unsupported platform configurations early
- *(cli)* Register virtual stylesheets in native dev and HMR
- *(patch)* Regenerate octane 0.2.5 patch with unified driver diff
- *(patch)* Resync lockfile hash and patch metadata after rebase
- *(lint)* Accept mason absolute positioning and sync the published rules copy
- *(leaves)* Route layout metadata through the style bag
- *(deps)* Unify @types/node pins to dedupe octane runtime copies
- *(tests)* Repair stale references and runner wiring
- *(tests)* Stop concurrent vite builds racing cli's dist during tests
- *(create)* Resolve scaffold/compatibility exports from source in-repo
- *(cli)* Only check the app-resolved copy in the compatibility scan
- *(patches)* Teach @nativescript/doctor to resolve pnpm catalog specifiers
- *(cli)* Define __WINDOWS__ in the native vite config
- *(patches)* Guard masonkit's iOS list delegate protocol binding
- *(testing)* Dispatch click alongside tap for MasonKit hosts

### Refactoring

- *(mcp)* Port the transport adapter to TypeScript
- *(cli,lint)* Port Node tooling source from .mjs to .ts
- *(toolchain)* Port remaining Node tooling from .mjs to .ts
- *(scripts,apps)* Port app-level Node tooling to .ts; unmark lint/create/tsrx-typegen
- *(linux-gtk-renderer)* Use @octane-xplat/jsx as the pragma source
- *(macos)* Element-behavior registry seam; masonview self-registers
- *(create)* Remove unreleased testing setup command
- *(macos)* Remove the classic layout engines

## [0.15.0] - 2026-10-18

### Breaking Changes

- *(ui)* [**breaking**] Honor field-state and accessibility props on platform switches
- *(ui)* [**breaking**] Give Button and menu states one spelling each
- *(ui)* [**breaking**] Align conditioned root exports and published CSS paths
- *(ui)* [**breaking**] Return typed handles from imperative overlay and window services
- *(ui)* [**breaking**] Require exclusive content sources and status-typed tool calls
- *(ui)* [**breaking**] Share keyed identity and selection across Table, TreeList, VirtualList
- *(ui)* [**breaking**] Separate store snapshots, mutations, and reactive reads
- *(ui)* [**breaking**] Give platform widgets matching type names
- *(ui)* [**breaking**] Name shared prop contracts and export matching types
- *(ui)* [**breaking**] Distinguish theme preference from resolved scheme, type styled variants and icon names
- *(table)* [**breaking**] Annotate DataGrid example row params for noImplicitAny
- *(ui)* [**breaking**] Reject duplicate route names with coded diagnostics
- *(ui)* [**breaking**] Expose typed scroll handles and preserve composed refs
- *(ui)* [**breaking**] Expose a single Markdown stream parser
- *(ui)* [**breaking**] Unify layout value space across platforms
- *(ui)* [**breaking**] Restore documented defaults when props are removed
- *(ui)* [**breaking**] Tighten public prop types
- *(ui)* [**breaking**] Move routing, data, markdown, and chat to purpose entrypoints
- *(ui)* [**breaking**] Scope search cancellation per request
- *(packages)* [**breaking**] Publish source with declaration entrypoints
- *(media)* [**breaking**] Return file handles only — drop PickedImage.dataUrl

### Features

- *(jsx)* Add @octane-xplat/jsx shared native type facade
- *(ui)* Restore portable query APIs and durable storage on macOS
- *(geolocation)* Support Core Location on native macOS
- *(motion)* Define bounded whole-word TextMorph semantics
- *(media)* Select images through the macOS file picker
- *(media)* Capture still photos in an app-owned macOS sheet
- *(audio)* Add safe macOS AVPlayer playback
- *(recorder)* Add safe macOS PCM WAV capture
- *(sounds)* Qualify bounded AppKit sound playback
- *(platform)* Add tagged keep-awake service and hook
- *(lib)* Extract internal shared class-name utility
- *(cli)* Version-pinned release docs retrieval for the MCP server
- *(mcp)* Shared MCP contracts for identity, capabilities, permissions, and evidence
- *(mcp)* Exact code retrieval and optional local semantic index for the MCP server
- *(mcp)* App-declared development-action registry (package G)
- *(mcp)* Runtime build/launch/logs/status across all six platforms
- *(ui)* Collection data hooks — useListData/useTreeData/useAsyncList
- *(lingui)* Locale utility hooks — useCollator/useListFormatter/useFilter
- *(ui)* Focus family — useFocus/useFocusRing/useFocusVisible/useFocusWithin/useLandmark + FocusScope
- *(ui)* GridList + useGridList — interactive 2D cell collection
- *(ui)* RA utility exports — mergeProps, useKeyboard, useObjectRef, useClipboard, refList/mergedRef, copyText
- *(mcp)* Connect installed-version documentation retrieval
- *(macos-renderer)* Implement shared StackLayout intrinsic
- *(mcp)* Qualify Chromium consumer inspection and input
- *(macos-renderer)* Implement ContentView single-child lifecycle
- *(mcp)* Qualify packed Chromium consumer over stdio
- *(workshop)* Add @octane-xplat/workshop dev package
- *(workshop)* Launch the Linux GTK/WebKitGTK host
- *(workshop)* Add unqualified iOS and Android preview adapters
- *(workshop)* Implement mobile Escape and Back dismissal contract
- *(workshop)* Qualify the macOS AppKit/JSC workshop target
- *(nano-icons)* Add shared-preparation icon leaf adapted from react-native-nano-icons
- *(mcp)* Make @octane-xplat/mcp publishable in the lockstep release
- *(camera)* Tap-to-focus via focusAtPoint and CameraView onTap (#24)
- *(nano-icons)* Replace SVG cache adapter with the font pipeline
- *(share)* Recover file sharing on current main
- *(platform)* Add storage.flush() with automatic suspend/exit durability
- *(ui)* Expose shared software keyboard inset hook
- *(toolchain)* Single combined tsconfig program per package/app with fixed platform-suffix order
- *(macos-renderer)* Implement DockLayout ordered edge layout
- *(macos-renderer)* Implement WrapLayout intrinsic with wrapping lifecycle
- *(ui)* Expose focus/outline capability contracts and split outline discovery
- *(ui)* Report async Button action failures via onActionError
- *(macos-renderer)* Implement viewless ProxyViewContainer projection
- *(cli)* Capture generated macOS SDK typings from objc-metadata-generator
- *(macos-renderer)* Switch AppKit typings to generated SDK declarations
- *(ui)* Unify controlled/initial/change roles across inputs and overlays
- *(ui)* Make field/menu/tab provider and accessibility composition explicit
- *(macos-renderer)* Implement raw RootLayout host
- *(macos-renderer)* Implement raw SearchBar host
- *(macos-renderer)* Implement viewless FormattedString intrinsic
- *(macos-renderer)* Implement HtmlView intrinsic
- *(macos-renderer)* Implement ActivityIndicator intrinsic
- *(macos-renderer)* Implement calendar-date DatePicker intrinsic
- *(macos-renderer)* Implement and qualify ListPicker intrinsic
- *(macos-renderer)* Implement and qualify Progress intrinsic
- *(macos-renderer)* Implement and qualify SegmentedBar intrinsic
- *(macos-renderer)* Implement and qualify SegmentedBarItem intrinsic
- *(macos-renderer)* Implement and qualify TimePicker intrinsic
- *(ui)* Expose awaitable async operations, cancellation, and pagination readiness
- *(macos-renderer)* Implement raw ListView intrinsic
- *(macos-renderer)* Implement raw tabview with logical item roots
- *(cli)* Agent-facing discovery and retrieval commands
- *(ui)* Add isolated query and icon registries
- *(ui)* Name render callback contexts
- *(ui)* Add serializable chat drafts, message data, and follow-latest
- *(ui)* Normalize interaction events and expose operation outcomes
- *(ui)* Expose focus and outline capabilities
- *(ui)* Discriminate selection and menu contracts
- *(create)* Add Octane Xplat library starter
- *(camera)* Prefer supported automatic iOS stabilization (#28)
- *(platform)* Expose platform-native types as explicit subpath modules
- *(platform)* Generate strict macOS SDK as module-scoped types and split runtime impl
- *(cli)* Agent-facing session and runtime commands via a per-workspace host
- *(ui)* Portalize native RootLayout overlays
- *(ui)* Preserve context through native portals
- *(macos-renderer)* Support Octane portals
- *(portals)* Preserve context across native hosts
- *(macos)* Portal raw tab and list content from its declaring tree
- *(ui)* Preserve context across owned services and native route boundaries
- *(cli)* Accept a positional target in xplat dev
- *(cli)* Resolve pnpm catalog: specifiers in patch version checks
- *(macos-renderer)* Remote image fetch and placeholder for <image>
- *(ui)* Port thumbhash encoder (rgbaToThumbHash) into hash-image
- *(ui)* Export thumbhash encoders from the package root
- *(ui)* ThumbHashUri — src → thumbhash per platform
- *(ui)* Align useClipboard with the Astryx clipboard lifecycle
- *(macos-renderer)* Implement raw Placeholder intrinsic
- *(ui)* Cascade container size to controls through SizeContext
- *(macos-renderer)* Implement raw ActionBar intrinsic
- *(macos-renderer)* Implement raw LiquidGlass intrinsic
- *(cli)* Add xplat fmt and hand spacing enforcement to the formatter
- *(create)* Add `format` script to scaffolded apps

### Bug Fixes

- *(platform)* Report and subscribe to native macOS connectivity
- *(biometrics)* Support Touch ID in macOS AppKit apps
- *(ui)* Restore macOS text control interaction parity
- *(richtext)* Apply leaf init once the Android native view exists
- *(jsx)* Restore cachedimage in the shared extension tag set
- *(ui)* Deliver AppKit press and swipe callbacks
- *(media)* Keep AppKit camera permission checks passive
- *(motion)* Isolate macOS package imports from mobile backends
- *(push)* Safely expose unavailable macOS backend
- *(ui)* Restore AppKit scroll viewport refs and geometry
- *(canvas)* Safely expose unsupported AppKit contexts
- *(motion)* Observe macOS reduced-motion preference
- *(motion)* Map AppKit opacity and transform channels
- *(pager)* Preserve page tracking and host updates
- *(notifications)* Guard delivery and preserve mobile notification content
- *(bamboo)* Validate portable config and native CSS adaptation
- *(auth)* Guard hosted and Google sign-in session races
- *(platform)* Close deep-link and host-protocol feedback gaps
- *(context-menu)* Close leaf lifecycle, dismissal, and packaging gaps
- *(gif,image)* Add windows gif stub and tighten the vendored prefetch batch
- *(haptics)* Align engine construction, web patterns, and play contracts
- *(image-crop)* Keep one active gesture and emit finite crops
- *(files)* Harden pick, read, and cleanup paths
- *(picker)* Align selection contract and web accessibility across leaves
- *(effects)* Close wrong-OS, lifecycle, availability, and drift gaps
- *(charts)* Tolerate bad data and colors; pick the nearest scatter point
- *(image)* Hold resolved sources, retarget layout listeners, guard decodes
- *(geolocation)* Add windows stub and clamp invalid accuracy
- *(date-picker)* Align day semantics, theming, and control across leaves
- *(canvas)* Fire web onReady once and honor string sizing
- *(camera)* Close settle, containment, and permission-chain gaps
- *(media)* Settle permission, picker, and capture paths like siblings
- *(macos-renderer)* Close stale-prop, margin, scroll, and accessibility gaps
- *(camera)* Stream host movie files in chunks instead of one base64 payload
- *(bamboo)* Ship a typed surface for the published exports
- *(ios)* Repair two Swift compile defects in picker and effects leaves
- *(media)* Register AppKit still captures for release and qualify the real sheet
- *(ui)* Name iOS tap-to-blur member after its exposed selector
- *(camera)* Validate chunked movie transfers and clean owned staging
- *(rolling-text)* Add AppKit host and settle reduced-motion updates
- *(lottie)* Widen intrinsic className typing via octane 0.2.4
- *(platform)* Add .js to import() specifiers in macOS declarations
- *(cli)* Bind installed tarballs to versioned MCP docs
- *(workshop)* Report Windows prerequisites and block unqualified launch
- *(typecheck)* Satisfy the windows program's merged timer globals and Utils stub
- *(macos-renderer)* Unbind dropped on* props on host updates
- *(ui)* Preserve composite grid placement and reflow late children
- *(ui)* Add LiquidGlass blur fallback and opt-in interaction
- *(lint)* Stop the tsrx pass at nested repository boundaries
- *(macos-renderer)* Match DockLayout percentage measurement basis
- *(nano-icons)* Use explicit glyph line heights and satisfy lint
- *(table)* Annotate DataGrid example rows with the full data type
- *(ui)* Keep syntax token offsets within each line
- *(lib)* Allow emitting build with TypeScript extensions disabled
- *(camera)* Accept unboxed iOS dictionary values (#26)
- *(camera)* Reset iOS interruption state on teardown (#27)
- *(ui)* Export SearchRequest from the package root
- *(macos)* Adapt app and renderer to the strict generated AppKit surface
- Exclude generated macos types from octane transform; disable ts-ext imports in lib build
- *(macos-renderer)* Drop ambient SDK tree from the typecheck program
- *(macos-renderer)* Import native names in packed lifecycle fixtures
- *(ui)* Keep native element typings internal
- *(runtime)* Dispose empty DOM provider content
- *(ui)* Share Android sheet keyboard inset bindings
- *(native)* Align Pager hooks and probe containers with portals
- *(cli)* Keep typegen watch running past a broken package
- *(macos-renderer)* Read NSArray.count as a property
- *(charts)* Align octane dev dep on the augmented intrinsics copy
- *(ui)* Wire parity entrypoints into typegen and export types
- *(create)* Restore scaffold-reproducible tsconfig array formatting
- *(lint)* Unflag native-portal imports, stale Link entry, generated typings
- *(platform)* Restore Runtime.d.ts filename casing for case-sensitive checkouts
- *(platform)* Restore prop-removal resets in the octane 0.2.5 driver patch
- *(platform)* Add src/ios+android shims for the src-subpath convention

### Refactoring

- *(ui)* Split Select into container and internal SelectView
- *(ui)* Isolate resolved PowerSearch family presentation
- *(ui)* Split BaseTypeahead into container and internal BaseTypeaheadView
- *(ui)* Make ComplexSelector presentation independently renderable
- *(leaves)* Remove redundant cx helpers
- *(typecheck)* Replace per-platform tsconfigs with shared tsconfig.envs.json
- *(macos-renderer)* Move AppKit surface off ambient globals
- Import platform-native names via @octane-xplat/platform subpaths
- *(cli)* Own the dev loop — xplat dev <target> replaces per-app shims
- *(parity)* Co-locate fixtures and checks with their components

## [0.14.0] - 2026-10-11

### Features

- _(camera)_ Shared camera-session movie-capture contract with iOS adapter
- _(camera)_ Record and reopen movies on Android and web
- _(camera)_ Preview and record movies on the Windows WinUI target
- _(camera)_ Record and reopen movies on macOS AppKit and WKWebView
- _(updates)_ Add recoverable next-launch OTA bundle updates
- _(camera)_ Record and reopen movies in the Linux WebKitGTK host

### Bug Fixes

- _(ui)_ Mark CodeBlock wrap styles web-only in tokens.css

## [0.13.0] - 2026-10-10

### Features

- _(dnd-kit)_ Add activation distance and drag handles
- _(ui)_ Add VirtualListHandle with scrollToOffset
- _(rolling-text)_ Add @octane-xplat/rolling-text package

### Bug Fixes

- _(cli,lint)_ Restore bins for link: consumers under pnpm 11
- _(macos-renderer)_ Normalize declarative className values before tokenizing
- _(dnd-kit)_ Close documented-behavior gaps in drag feedback and auto-scroll
- _(patches)_ Resolve # package-imports specifiers in the /ns/m device rewrite
- _(lottie)_ Accept nullable native host ref
- _(rolling-text)_ Avoid Unicode regex literal in native bundle

## [0.12.0] - 2026-10-08

### Features

- _(ui)_ Add qualified optional testID hosts
- _(mobile)_ Qualify on-device Vitest lane via @nativescript/unit-test-runner
- _(testing)_ Ship on-device Vitest lane and first mobile contract suite

### Bug Fixes

- _(macos-renderer)_ Reschedule layout after pin writes inside layout()
- _(patches)_ Preserve compiler anchors during whitespace cleanup
- _(icons)_ Encode macOS SVG sources as base64 data URIs
- _(macos)_ Sign dev host bundle with a stable certificate identity
- _(macos-renderer)_ Make stack layout sync first-responder safe
- _(patches)_ Sync package files before packing
- _(runtime)_ Export Children from universal native entries
- _(editors)_ Align native content lifecycle and explicit format subsets
- _(macos)_ Skip dev bundle signing on hosts without codesign

## [0.11.1] - 2026-10-08

### Bug Fixes

- _(macos-renderer)_ Pin grid/absolute children with constraints, not frame writes
- _(packages)_ Ship entries consumable by NativeScript vendors
- _(platform)_ Use ArrayBuffer-backed web random chunks
- _(cli)_ Launch macOS dev hosts with app name and icon
- _(macos-renderer)_ Match action selector strings to registered ObjC methods
- _(macos-renderer)_ Decode images outside batch apply
- _(macos-renderer)_ Honor secure/enabled state and per-edit events on text controls
- _(macos-renderer)_ Resolve package typecheck failures
- _(macos-renderer)_ Batch sibling layout work, fix margin indices and layout observers
- _(macos-renderer)_ Reset native state when styles and classes are removed
- _(macos-renderer)_ Unwind failed creates and preflight batch commands
- _(macos-renderer)_ Suppress warnings for layout child props
- _(macos)_ Implement CefAppProtocol on the JSC host application
- _(smooth-corners)_ Forward layout props through the platform wrappers
- _(create)_ Publish scaffold subpath export
- _(lint)_ Resolve local DOM-like bindings
- _(packages)_ Bind node's URL class in vite configs
- _(macos)_ Supply standalone effective appearance lifecycle
- _(macos-renderer)_ Honor label wrapping and overflow props
- _(icons)_ Generate renderer-aware JSX types
- _(macos)_ Normalize container layout across input channels
- _(smooth-corners)_ Emit undefined for unset layout props so removals reconcile

### Refactoring

- _(macos-renderer)_ Port .mjs sources to TypeScript

## [0.11.0] - 2026-10-07

### Features

- _(ui)_ Emit the macOS types entry with tsrx-typegen
- _(tiptap)_ Accept web-target tiptap extensions via props.web
- _(lexical)_ Complete web editor facade
- _(files)_ Add binary readBytes/writeBytes and qualified export
- _(platform)_ Add OS CSPRNG random service
- _(recorder)_ Add @octane-xplat/recorder leaf for WAV microphone capture
- _(auth)_ Add createHostedAuth — generic hosted sign-in + Bearer session transport
- _(richtext)_ Add structural split/join/indent/outdent commands to the Android surface
- _(richtext)_ Back the iOS leaf with AztecEditor-iOS
- _(shaders)_ Add @octane-xplat/shaders thin adapter
- _(gif)_ Add prefetch() and platform escape bags (expo-image L3/L6)
- _(ui)_ Add Image recyclingKey to blank recycled platform-list cells
- _(ui)_ Give Image a shared contentFit/contentPosition contract and srcset-style multi-source src
- _(ui)_ Add Image placeholder prop with blurhash/thumbhash decode
- _(ui)_ Add Image decoding prop (async default, sync opt-in)
- _(image,gif)_ Unify prefetch contract across the image-engine leaves
- _(image)_ Batch isImageCached + forward decode context on iOS

### Bug Fixes

- _(ui)_ Repair macOS source defects hidden by the handwritten types entry
- _(tiptap,lexical)_ Apply initial json prop once bridge and host are ready
- _(files)_ Honest export/writeBytes failure and single-flight export
- _(tiptap)_ Import TiptapJSON in native editor facade
- _(files)_ Wrap Android readBytes output in ByteBuffer
- _(smooth-corners)_ Glob test files so node --test resolves them on Node 24
- _(bamboo)_ Import virtual:bamboo.css from the NativeScript entry
- _(lottie)_ Type-guard the iOS stop() call on nativeViewProtected
- _(ui)_ Decode native images to view size, not source size
- _(probe)_ Map deep core subpaths in the mobile host module table
- _(patches)_ Stop treating per-package turbo.json as the dev-server workspace root
- _(patches)_ Restore ui-image 5.x iOS prefetch cacheType and headers

### Refactoring

- _(macos)_ Convert the AppKit harness to TypeScript

## [0.10.0] - 2026-10-04

### Breaking Changes

- [**breaking**] Replace bind with standard Octane refs

### Features

- _(lexical)_ Add @octane-xplat/lexical unified editor facade
- _(ui)_ Add Astryx-aligned component names
- _(ui)_ Standardize field control props
- _(ui)_ Add opt-in chrome stylesheet
- _(ui)_ Add search and token selection components
- _(ui)_ Add cross-platform chat family
- _(ui)_ Add content display components
- _(ui)_ Add Astryx forms and layout primitives
- _(ui)_ Add Astryx search and action controls
- _(ui)_ Add portable date and file entry controls
- _(ui)_ Add Astryx navigation and workspace components
- _(ui)_ Add Astryx overlay and media primitives
- _(files)_ Own FileInput with built-in platform pickers
- _(table)_ Add @octane-xplat/table leaf package
- _(motion)_ Delegate declarative tweens to platform animators
- _(icons)_ Add bundled Iconify rendering for web and mobile
- _(icons)_ Render bundled SVGs on native AppKit
- _(dnd-kit)_ Add shared drag and drop and native sortable lists
- _(dnd-kit)_ Support AppKit drag input and sortable lists
- _(smooth-corners)_ Add @octane-xplat/smooth-corners leaf package
- _(ui)_ Add anchored useLayer primitive
- _(ui)_ Render Windows SVG content with WinUI
- _(ui)_ Position Windows popovers with WinUI coordinates
- _(charts)_ Add @octane-xplat/charts leaf package
- _(ui)_ Strengthen finite-list selector interactions
- _(motion)_ Widen transition vocabulary to upstream shape
- _(motion)_ WhileTap/whileFocus, callbacks, motion.create, useAnimate
- _(table)_ Add interactive DataGrid controls
- _(motion)_ Add bounded declarative drag with native arbitration
- _(motion)_ Add bounded variants and child orchestration
- _(image-crop)_ Add inline cross-platform crop selection
- _(macos-renderer)_ Support contain-fit images and input-transparent layers
- _(image-crop)_ Add AppKit inline selection support
- _(ui)_ Add source-backed cross-platform command palette
- _(cli)_ Add xplat fonts add for cross-platform custom fonts
- _(cli)_ Support fontsource packages and woff inputs in xplat fonts add
- _(notifications)_ Implement native AppKit local delivery
- _(ui)_ Make Markdown streaming-ready with an incremental runtime parser
- _(create)_ Let create scaffold a chosen platform subset
- _(cli)_ Add xplat add <platform> for post-scaffold enablement
- _(charts)_ Render charts with AppKit on macOS
- _(editors)_ Host AppKit facades in local WKWebView
- _(motion)_ Delegate declarative bezier tweens to WAAPI on web
- _(sheet)_ Add accessible web modal behavior
- _(ui)_ Embed WKWebView documents on AppKit
- _(macos-renderer)_ Add internal type coverage
- _(ui)_ Add shared menu choices and nested navigation
- _(ui)_ Match optional segments and terminal catch-alls in route patterns
- _(ui)_ Add shared keyed query cache over query$
- _(ui)_ Add route-level error boundary and loader pending state
- _(ui)_ Add native platform list viewability API
- _(secure-storage)_ Support AppKit with macOS Keychain
- _(lottie)_ Add AppKit playback support
- _(macos)_ Present shared overlays with AppKit lifecycle and focus

### Bug Fixes

- _(ui)_ Preserve chat prop boundary after rebase
- _(ui)_ Reconcile navigation props after rebase
- _(ui)_ Migrate overlay consumers to Astryx APIs
- _(ui)_ Use native macOS file picker
- _(ui)_ Reconcile Astryx APIs with current harness and build
- _(motion)_ Monotonic native clock and event-driven iOS reduced motion
- _(ui)_ Ignore Android SafeArea escape props on Windows
- _(ui)_ Retain VisuallyHidden sizing in native styles
- _(ui)_ Use a readable native Code font size
- _(ui)_ Use the native monospace font family
- _(ui)_ Give selection indicators visible geometry
- _(ui)_ Point mobile layers at shared native helpers
- _(ui)_ Restore AppKit platform resolution and hook compilation
- _(ui)_ Narrow peer dependency contract
- _(windows)_ Remove unused UI plugin dependencies
- _(ui)_ Register iOS tap-to-blur target without NativeClass
- _(ui)_ Defer VirtualList estimate renders beyond resize delivery
- _(table)_ Wait for valid native layout before measuring header
- _(ui)_ Preserve controlled date values and validate range presets
- _(charts)_ Adopt useMeasure ref surface from main's bind migration
- _(motion)_ Restore component wiring lost in the bind-to-ref refactor
- _(ui)_ Animate AppKit refs with shared timed and spring playback
- _(ui)_ Filter undefined entries from leaf ref arrays
- _(platform)_ Post native AppKit accessibility announcements
- _(image-crop)_ Use useMeasure ref surface after bind migration
- _(auth)_ Complete AppKit provider and browser session flows
- Resolve extracted macOS renderer in leaf typechecks
- _(windows)_ Repair pointer observer ownership and lifecycle
- _(windows)_ Integrate parent-driven percentage sizing
- _(macos)_ Unblock AppKit harness and restore smoke checks
- _(ui)_ Preserve array refs when leaves merge internal and caller refs
- _(ui)_ Defer VirtualList rebuilds after resize delivery
- _(audio)_ Pass null for session deactivation error
- _(lottie)_ Report web animation setup failures
- _(lottie)_ Bind web animation handles on mount
- _(web)_ Close browser support gaps
- Restore mobile package typechecks
- _(ui)_ Add shared SVG declaration entry
- _(ui)_ Restore platform lint boundaries
- _(sqlite)_ Harden Web database handle lifecycle
- _(ui)_ Restore web modal focus after pointer activation
- _(ui)_ Require accessible names for modal overlays
- _(platform)_ Initialize web app state from visibility
- _(web)_ Qualify optional audio across browsers
- _(web)_ Complete standard ref migration
- _(ui)_ Keep native element types out of published declarations
- _(table)_ Remove duplicate feature type export
- _(types)_ Restore mobile harness validation
- _(web)_ Preserve browser receiver for animation frames
- _(ui)_ Preserve composed array refs through wrappers
- _(motion)_ Preserve descendant pointer click targets
- _(lint)_ Resolve pnpm lint errors
- _(cli)_ Update the lockfile when add or patches apply change deps
- _(ui)_ Build the markdown word-char regex without \p{} literals
- _(ui)_ Keep bare \p{ out of the WORD_CHAR doc comment
- _(ui)_ Normalize JSX children and host native text slots
- _(cli)_ Allow linked-dep roots in xplatNative fs.allow
- _(ui)_ Let Android children draw outside their layout bounds
- _(cli)_ Normalize letter-spacing units for native css
- _(ui)_ Share tooltip layers and audit Astryx parity
- _(ui)_ Reconcile AppKit barrel declarations and packed consumers
- _(ui)_ Coordinate nested layer dismissal across roots
- _(ui)_ Settle VirtualList measurements and preserve AppKit row order
- _(ui)_ Complete bounded date keyboard and locale parity
- _(ui)_ Complete portable layer positioning
- _(table)_ Complete bounded selection and accessibility parity
- _(ui)_ Present macOS command palettes modally and reveal highlights
- _(ui)_ Reconcile parity changes with typed renderer and moved docs
- _(cli)_ Apply the platform extension chain to native dev resolution
- _(patches)_ Resolve /ns/m node_modules URLs against linked-dep roots
- _(ui)_ Draw Android svgviews through a proxied View subclass
- _(lingui)_ Map .tsrx extraction origins to authored lines
- _(table)_ Make native test leaves pass app typecheck
- _(web)_ Own scroll restoration per history entry
- _(ui)_ Respect list lifecycle during viewability
- _(typecheck)_ Make every target program and package check green
- _(ui)_ Share tooltip layers and audit Astryx parity
- _(ui)_ Coordinate nested layer dismissal across roots
- _(windows)_ Restore core input and accessibility contracts
- _(ui)_ Complete bounded date keyboard and locale parity
- _(ui)_ Add macOS query storage leaf backed by memory adapter
- _(ui)_ Declare RouteBoundary and errorBoundaryFor in macOS types
- _(ui)_ Remove duplicated shared re-export block from macOS types

### Refactoring

- Migrate first-party layouts to HStack
- _(ui)_ Layer shared field structure
- _(ui)_ Share native overlay foundations with Windows
- _(ui)_ Share native route host helpers across targets
- _(macos)_ Extract renderer into a workspace package
- _(create)_ Split scaffold into a per-target manifest + composer
- _(macos-renderer)_ Port sources to TypeScript

## [0.9.0] - 2026-10-02

### Features

- _(intersection-observer)_ Add cross-platform visibility package
- _(intersection-observer)_ Support macOS AppKit views
- _(platform)_ Add typed desktop webview host contract
- _(linux)_ Expose desktop host services through WebKitGTK
- _(macos)_ Implement shared WKWebView desktop bridge

### Bug Fixes

- _(release)_ Align package repository URLs for provenance

## [0.8.0] - 2026-10-02

### Breaking Changes

- _(share)_ [**breaking**] Extract @octane-xplat/share leaf from @octane-xplat/platform
- _(platform)_ [**breaking**] Extract all plugin-backed services into leaf packages

### Features

- _(cli)_ Ship scaffold patches as config dependency
- _(date-picker)_ Port Expo's DatePicker/TimePicker into platform leaves
- _(context-menu)_ Port Expo's ContextMenu/DropdownMenu into platform leaves
- _(sheet)_ Port Expo's BottomSheet/ModalBottomSheet into platform leaves
- _(auth)_ Add @octane-xplat/auth — Sign in with Apple + Google Sign-In
- _(auth)_ Implement Sign in with Apple + authSession on macOS
- _(platform)_ Add macOS share sheet support
- _(effects)_ Ship shader registration inside the leaf
- _(push)_ Add @octane-xplat/push leaf — Firebase Cloud Messaging on all targets
- _(sqlite)_ Add @octane-xplat/sqlite leaf for cross-target persistence
- _(sqlite)_ Run sqlite-wasm in-process on macOS
- _(sqlite)_ Bind system libsqlite3 on macOS via host metadata interop
- _(context-menu)_ Add the AppKit leaf
- _(date-picker)_ Add the AppKit leaf
- _(sheet)_ Add the AppKit leaf
- _(ui)_ Typed programmatic routes via literal-path inference
- _(cli)_ Fail builds on platform-boundary module leaks
- _(ui,cli)_ Baked dataMode — route loaders that run at codegen
- _(ui,cli)_ Markdown files as baked routes
- _(ui,cli)_ Normalized JSON route manifest for external hosts
- _(sqlite)_ Run sqlite-wasm in-process on macOS
- _(sqlite)_ Bind system libsqlite3 on macOS via host metadata interop
- _(cli)_ Compile macOS leaf sources and generate app metadata
- _(cli)_ Integrate macOS native leaves into dev and packaged apps
- _(bridge)_ Add typed desktop host contracts and macOS proof
- _(macos)_ Add system webview desktop backend
- _(lottie)_ Add @octane-xplat/lottie leaf package
- _(lottie)_ Vendor the ui-lottie fork inside the leaf
- _(cli)_ Add Linux WebKitGTK app packaging
- Persist the selected color scheme
- Add isolated platform probe runner
- _(cli)_ Define process.env.NODE_ENV at the bundler level
- _(bamboo)_ Integrate portable CSS utilities
- _(richtext)_ Add @octane-xplat/richtext leaf with Android Aztec editor
- _(tiptap)_ Add @octane-xplat/tiptap unified editor facade
- _(lingui)_ Add @octane-xplat/lingui leaf package

### Bug Fixes

- _(ui)_ Preserve web pan gestures through rerenders
- _(leaves)_ Point export types at the platform barrel, not types.ts
- _(context-menu)_ Create the Android trigger host with a real Context
- _(macos)_ Converge deep seeks — suppress corrections mid-seek, docH-free offset
- _(ui)_ Preserve native pan cancellation
- _(cli)_ Resolve app imports lazily in xplatNative
- _(ui)_ Share KeyboardAvoiding root API
- _(audio)_ Repair iOS system playback controls
- _(app)_ Correct navigation parity and media probe usage
- _(manifests)_ Remove rebase conflict markers
- _(platform)_ Build the auth-session anchor class lazily
- _(data)_ Preserve query ownership and native suspense events
- _(cli)_ Probe the .mobile suffix tier in the ns-vite type check
- _(ui)_ Emit web-variant declarations and fix the packed consumer
- _(ui)_ Retain prepared routes across browser history
- _(navigation)_ Handle malformed and repeated incoming links
- _(ui)_ Unmount route roots when native modals dismiss
- _(ui)_ Prevent controlled native text echoes and release editing focus
- _(ui)_ Support keyboard actions and prevent disabled activation
- _(ui)_ Convert Android keyboard insets to layout units
- _(ui)_ Contain and restore focus for shaded web overlays
- _(typecheck)_ Exclude platform directories from the mobile program
- _(create)_ Ship a starter that installs and lints cleanly
- _(ui)_ Keep the phantom route key out of the published value surface
- _(cli)_ Report unresolvable patches as not-applicable
- _(lint)_ Correct rule scopes and clear the violation backlog
- _(ui)_ Preserve VirtualList visible anchor on web data updates
- _(ui)_ Prevent stale route loads from overriding navigation
- _(ui)_ Release native overlay hosts and theme subscriptions
- _(ui)_ Cancel long presses when their interaction ends
- _(ui)_ Keep PIN edits in their intended cells
- _(ui)_ Grow uncontrolled textareas as users type
- _(ui)_ Tolerate navigation events without a payload
- _(ui)_ Unblock typegen by narrowing restored route state
- _(patches)_ Carry upstream runtime fixes
- _(platform)_ Settle hosted auth sessions safely on failure and retry
- _(media)_ Clean up temporary previews when image conversion fails
- _(audio)_ Release browser sound voices and system controls on teardown
- _(cli)_ Resolve builtin-named deps in the macOS native scan
- _(macos)_ Repair the dev bundle against main drift
- _(cli)_ Refresh NativeScript Vite patch at 8.0.17
- _(leaves)_ Resolve packed declaration specifiers under NodeNext
- _(sqlite)_ Import SqliteParam in the macOS database backend
- Restore Android development startup and native JSX types
- _(ui)_ Reduce VirtualList scroll and measurement work
- _(ui)_ Restore generated web barrel for platform-leaf resolution
- _(ui)_ Declare Markdown exports on the macOS type surface
- _(ui,lottie)_ Rewrite vendored specifiers to the emitted paths
- _(tiptap)_ Keep upstream's bare process.env read in the @octanejs/tiptap patch
- _(richtext,tiptap)_ Emit types.d.ts from src/types.ts
- _(create)_ Tolerate unused framework patches in scaffolded apps

### Performance

- _(ui)_ Recycle and position VirtualList cells

### Refactoring

- _(web)_ Share desktop host services across webview backends

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
