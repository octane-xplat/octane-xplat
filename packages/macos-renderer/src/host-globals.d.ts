// Ambient host globals injected by @nativescript/macos-node-api and the
// embedding Node process — runtime loader, the renderer's __xplatAppKit bridge
// channel, and the Node-ish globals the macOS host provides.
// Runtime framework loader injected by the bridge host.
// `declare global` member types resolve ambiently — module imports don't bind
// inside the global block — so AppKit names use inline import() types.
declare global {
	function dlopen(path: string, flags: number): unknown

	// Cross-package bridge published by this renderer for AppKit-specific leaves
	// (hover, popups, menus, sheets) and the VirtualList offset channel.
	var __xplatAppKit: {
		/** Renderer-owned heading snapshot; no mutation tracking or navigation proof. */
		readOutlineHeadings?: (view: object) => { id: string; label: string; level: number; view?: object }[]
		/** Image-owned encoded disk bytes plus decoded memory, separate from shared HTTP caching. */
		imageCache?: {
			readonly supportsCachePolicy?: boolean
			readonly supportsLoadEvents?: boolean
			initialize(): boolean
			prefetch(source: string): Promise<boolean>
			isCached(source: string): 'memory' | 'disk' | 'none'
			evict(source: string): boolean
			clear(): boolean
		}
		/** Private renderer decoded-memory cache only; no disk/HTTP-cache claim. */
		imageMemoryCache?: {
			isCached(source: string): boolean
			evict(source: string): void
			clear(): void
		}
		readonly keyboardEventsSupported?: boolean
		readGridCells?: (root: object, nestedRoots?: readonly object[]) => object[]
		/** CSS hover/focus-within source capability; not native input qualification. */
		readonly containerRevealSupported?: boolean
		/** Owned native layout pins and row ordering; OS hit-testing remains unqualified. */
		retainTableStickyPlacement?: (view: object) => import('./sticky-placement.ts').StickyPlacementLease | undefined
		readonly focusWithinSupported?: boolean
		readonly contextMenuEventsSupported?: boolean
		observeFileDrop?: (view: import('@octane-xplat/platform/macos').NSView, handlers: { enabled(): boolean; receive(uris: string[]): boolean }) => () => void
		observeContextMenu?: (view: import('@octane-xplat/platform/macos').NSView, handler: (target: import('@octane-xplat/platform/macos').NSView) => boolean) => () => void
		observePointerInput?: (notify: (event: { type: number; modifierFlags: number }) => void) => () => void
		/** Coordinate Xplat key handlers before an independent scope monitor. */
		dispatchKeyboardEvent?: (event: unknown) => { defaultPrevented: boolean; propagationStopped: boolean }
		/** Observe app key input before a handler/scope cancels native dispatch. */
		observeHardwareKeys?: (notify: (event: { type: number; modifierFlags: number }) => void) => () => void
		/** Private composed-control key lease, alongside reconciled prop handlers. */
		observeViewKeys?: (view: import('@octane-xplat/platform/macos').NSView, handlers: {
			onKeyDown?: (event: import('@octane-xplat/jsx/intrinsics').NativeKeyboardEvent<object>) => void
			onKeyUp?: (event: import('@octane-xplat/jsx/intrinsics').NativeKeyboardEvent<object>) => void
		}) => () => void
		/** Exclude a self-drawn native host from Tab without rejecting arrow focus. */
		suppressTabStop?: (view: import('@octane-xplat/platform/macos').NSView) => () => void
		/** Opt a disabled self-drawn host into focus without enabling activation. */
		retainDisabledFocus?: (view: import('@octane-xplat/platform/macos').NSView) => () => void
		/** Retain programmatic focus on a scope box without a Tab stop/action. */
		retainFocusTarget?: (view: import('@octane-xplat/platform/macos').NSView) => () => void
		observeHover?: (view: import('@octane-xplat/platform/macos').NSView, handlers: any) => void
		/** NSTrackingArea move/exit lease per call — hover-style coordinates, no event monitor. */
		observePointerMotion?: (view: import('@octane-xplat/platform/macos').NSView, handlers: { move(x: number, y: number): void; exit(): void }) => () => void
		/** Current mouse event's point in view coordinates; valid only inside the dispatch (tap). */
		locatePointer?: (view: import('@octane-xplat/platform/macos').NSView) => { x: number; y: number } | null
		showAnchoredPopup?: (options: any) => void
		showLayer?: (options: any) => any
		attachContextMenu?: (
			view: import('@octane-xplat/platform/macos').NSView,
			options: any,
			onSelect: any,
		) => (() => void) | null
		attachPicker?: (
			view: import('@octane-xplat/platform/macos').NSView,
			options: { options: readonly { id: string; title: string; disabled?: boolean }[]; selection?: string; enabled: boolean; accessibilityLabel?: string },
			onSelect: (id: string) => void,
		) => { update(options: any): void; detach(): void } | null
		attachDatePicker?: (
			view: import('@octane-xplat/platform/macos').NSView,
			options: any,
			onChange: any,
		) => { update(options: any): void; detach(): void } | null
		presentSheet?: (
			view: import('@octane-xplat/platform/macos').NSView,
			options: { onDismissed?(): void; onUnavailable?(): void },
		) => import('./sheet.macos').NativeSheetHandle | null
		presentSurface?: (options: any) => any
		setSurfaceAppearance?: (
			view: import('@octane-xplat/platform/macos').NSView,
			dark: boolean,
		) => void
		/** App-wide NSApp.appearance override — 'light'/'dark' pins the effective
		 *  appearance, null restores system following. */
		setAppearanceOverride?: (scheme: 'light' | 'dark' | null) => void
		[key: string]: any
	}

	var __xplatVlistOffsets: { [key: string]: number } | undefined

	// Node host globals.
	const performance: { now(): number }
	function setTimeout(callback: () => void, ms?: number): unknown
	function clearTimeout(timer: unknown): void
	function queueMicrotask(callback: () => void): void
	const console: {
		log(...args: any[]): void
		warn(...args: any[]): void
		error(...args: any[]): void
		[key: string]: any
	}

	// The macOS host embeds Node — process.env reads and cwd() are real.
	// Other programs may declare a narrower process ambient; duplicate ambient
	// consts merge loosely under skipLibCheck, so keep both members here.
	const process: { env: { [key: string]: string | undefined }; cwd(): string }
}

export {}
