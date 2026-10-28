import type { Octane } from 'octane/jsx-runtime'

/**
 * Native counterpart of use-landmark.web.tsrx. Region cycling (F6) is a
 * web/screen-reader keyboard convention with no native analogue, so this
 * leaf only forwards the accessibility role and label — the semantic part
 * of the contract that does port. Same public types as the web leaf.
 */

export interface UseLandmarkOptions {
	role:
		| 'main'
		| 'navigation'
		| 'search'
		| 'form'
		| 'region'
		| 'banner'
		| 'contentinfo'
		| 'complementary'
	label?: string
}

/** Props `useLandmark` returns to spread on the landmark host — the resolved
 *  ARIA role plus label and ref wiring. */
export interface LandmarkProps {
	accessibilityRole: string
	accessibilityLabel?: string
	ref?: Octane.Ref<any>
}

/**
 * Landmark navigation wiring (React Aria `useLandmark`) — keyboard jumps between landmarks on web.
 *
 * @see FocusScopeProps.
 */
export function useLandmark(options: UseLandmarkOptions): { landmarkProps: LandmarkProps } {
	return {
		landmarkProps: {
			accessibilityRole: options.role,
			accessibilityLabel: options.label,
		},
	}
}
