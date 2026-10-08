import type { UniversalRoot } from 'octane/universal/native'

/** Handle returned by `presentSurface`. `panel` hosts the rendered subtree
 * inside `layer`, the full-window hit-test surface that owns dismissal. */
export interface PresentationSurface {
	update(options: Record<string, any>): void
	close(reason?: string): void
	readonly closed: boolean
	readonly closedPromise: Promise<string | undefined>
	panel: any
	layer: any
}

/** Members `installPresentationBridge` assigns onto `__xplatAppKit` for
 * renderer-hosted in-window surfaces (sheets, toasts, lightboxes). */
export interface PresentationBridge {
	setSurfaceAppearance?: (view: any, dark: boolean) => void
	presentSurface?: (initial: Record<string, any>) => PresentationSurface
	[key: string]: any
}

/** Wires the shared-surface implementation into the AppKit bridge. The
 * renderer supplies its root factory and the inherited-font lookup; native
 * objects flow through `any` like the layer bridge. */
export function installPresentationBridge(
	bridge: PresentationBridge,
	createRoot: (hostView: any, options?: { fontFamily?: string }) => UniversalRoot,
	fontFamilyForView: (view: any) => string | undefined,
): void
