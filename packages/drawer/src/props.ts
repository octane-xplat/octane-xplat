import type { ClassValue, CSSProperties } from 'octane/jsx-runtime'

/** Slide-over navigation panel from `@octane-xplat/drawer`. Mobile uses
 * ui-drawer's native gesture engine; web and desktop use a composed panel.
 * Supply an accessible open/close control in your content on every target.
 * @example
 * ```tsx
 * import { Drawer } from '@octane-xplat/drawer'
 * <Drawer defaultOpen main={null} drawer={null} />
 * ```
 */
export interface DrawerProps {
	className?: ClassValue
	style?: string | CSSProperties
	id?: string
	main?: unknown
	drawer?: unknown
	/** Controlled visibility. User requests are reported through onOpenChange. */
	open?: boolean
	/** Initial uncontrolled visibility. @default false */
	defaultOpen?: boolean
	/** User-requested visibility, including mobile edge opening and dismissal.
	 * Programmatic prop changes do not echo through this callback. */
	onOpenChange?: (open: boolean) => void
	/** User dismissal (backdrop, close gesture, Escape or Android Back). */
	onDismiss?: () => void
	/** Panel width in dips (CSS pixels on web). @default 280 */
	width?: number
	/** Mobile edge-open and drag-close gestures. Web/desktop have no edge
	 * recognizer. Explicit controls and backdrop dismissal remain available.
	 * @default true */
	isGestureEnabled?: boolean
	/** Skip mobile panel animation. Also honors the OS reduced-motion setting.
	 * Web/desktop panels have no built-in transition. @default false */
	reducedMotion?: boolean
	/** Spoken name for the panel. @default "Navigation" */
	accessibilityLabel?: string
	/** Receives mobile animation failures instead of an unhandled rejection. */
	onError?: (error: unknown) => void
	/** Platform host properties, applied after shared configuration. */
	ios?: Record<string, unknown>
	android?: Record<string, unknown>
	web?: Record<string, unknown>
}
