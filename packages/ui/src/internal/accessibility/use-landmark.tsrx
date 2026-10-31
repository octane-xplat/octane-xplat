/** @jsxImportSource @octane-xplat/jsx */
import type { Octane } from 'octane/jsx-runtime'

/** Semantic native fallback. Hosts without region-key routing forward role
 * and label only; AppKit selects its dedicated F6/Shift+F6 leaf. */
export interface UseLandmarkOptions {
	/** Landmark kind — the region keyboard navigation jumps to. */
	role:
		| 'main'
		| 'navigation'
		| 'search'
		| 'form'
		| 'region'
		| 'banner'
		| 'contentinfo'
		| 'complementary'
	/** Accessible name announced for the landmark. */
	label?: string
}

/** Props `useLandmark` returns to spread on the landmark host — the resolved
 *  ARIA role plus label and ref wiring. */
export interface LandmarkProps {
	/** Resolved role forwarded to the host's accessibility role. */
	accessibilityRole: string
	/** Accessible name forwarded to the host. */
	accessibilityLabel?: string
	/** Host ref for keyboard focus targeting. */
	ref?: Octane.Ref<any>
}

/**
 * Landmark navigation wiring (React Aria `useLandmark`) — keyboard jumps between landmarks on web.
 *
 * @see FocusScopeProps.
 */
export function useLandmark(options: UseLandmarkOptions): {
	/** Props to spread on the landmark host. */
	landmarkProps: LandmarkProps
} {
	return {
		landmarkProps: {
			accessibilityRole: options.role,
			accessibilityLabel: options.label,
		},
	}
}
