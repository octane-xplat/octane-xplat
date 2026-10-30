import { useRef, useState } from 'octane'
import { useFocusVisible } from './use-focus-visible'

/**
 * Focus-event composition — React Aria's useFocus/useFocusRing family.
 * Returned props spread onto any component or element that forwards
 * onFocus/onBlur. Web callbacks receive a DOM-shaped `FocusEventPayload`;
 * NativeScript and macOS controls may invoke them without an event.
 *
 * useFocusWithin tracks descendants on web and raw AppKit containers;
 * the default mobile leaf reports single-element focus only.
 */

export interface UseFocusOptions {
	isDisabled?: boolean
	onFocus?: (event?: FocusEventPayload) => void
	onBlur?: (event?: FocusEventPayload) => void
	onFocusChange?: (isFocused: boolean) => void
}

/** Portable shape of a web focus event. Native and macOS text controls may
 *  invoke focus callbacks without an event payload. */
export interface FocusEventPayload {
	readonly type: string
	readonly target: unknown
	readonly currentTarget: unknown
	readonly relatedTarget: unknown
	preventDefault(): void
	stopPropagation(): void
}

/**
 * Focus a host element on demand or mount — returns the ref callback + focused state.
 *
 * @see useFocusWithin, useFocusRing.
 */
export function useFocus(options: UseFocusOptions = {}): {
	focusProps:
		| {
				onFocus?: undefined
				onBlur?: undefined
		  }
		| {
				onFocus: (event?: FocusEventPayload) => void
				onBlur: (event?: FocusEventPayload) => void
		  }
} {
	const latest = useRef(options)
	latest.current = options
	return {
		focusProps: latest.current.isDisabled
			? {}
			: {
					onFocus: (event?: FocusEventPayload) => {
						latest.current.onFocus?.(event)
						latest.current.onFocusChange?.(true)
					},
					onBlur: (event?: FocusEventPayload) => {
						latest.current.onBlur?.(event)
						latest.current.onFocusChange?.(false)
					},
				},
	}
}

/**
 * `useFocusRing` result — `isFocusVisible`/`isFocused`/`focusProps`.
 */
export interface UseFocusRingResult {
	isFocused: boolean
	/** Focused AND the tracked input modality is keyboard (web/AppKit).
	 * The default mobile tracker reports false. */
	isFocusVisible: boolean
	/** Whether this target tracks keyboard/pointer modality for focus rings. */
	isFocusVisibleSupported: boolean
	focusProps: { onFocus: () => void; onBlur: () => void }
}

/**
 * Focus-visible ring state for a host element (RA parity) — `isFocusVisible` only for keyboard focus.
 *
 * @see UseFocusRingResult.
 */
export function useFocusRing(): UseFocusRingResult {
	const [isFocused, setFocused] = useState(false)
	const { isFocusVisible, isSupported: isFocusVisibleSupported } = useFocusVisible()
	return {
		isFocused,
		isFocusVisible: isFocused && isFocusVisible,
		isFocusVisibleSupported,
		focusProps: {
			onFocus: () => setFocused(true),
			onBlur: () => setFocused(false),
		},
	}
}
