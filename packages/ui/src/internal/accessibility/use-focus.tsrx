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
	/** Suppresses the handlers and focused state. */
	isDisabled?: boolean
	/** Fires when the element gains focus. */
	onFocus?: (event?: FocusEventPayload) => void
	/** Fires when the element loses focus. */
	onBlur?: (event?: FocusEventPayload) => void
	/** Fires on every focused-state transition with the new value. */
	onFocusChange?: (isFocused: boolean) => void
}

/** Portable shape of a web focus event. Native and macOS text controls may
 *  invoke focus callbacks without an event payload. */
export interface FocusEventPayload {
	/** Event kind — 'focus' or 'blur'. */
	readonly type: string
	/** Element the event fired on. */
	readonly target: unknown
	/** Element the handler is attached to. */
	readonly currentTarget: unknown
	/** Related element across the focus transition (previous/next focused element). */
	readonly relatedTarget: unknown
	/** Blocks the platform's default focus behavior. */
	preventDefault(): void
	/** Stops the event reaching ancestor handlers. */
	stopPropagation(): void
}

/**
 * Focus a host element on demand or mount — returns the ref callback + focused state.
 *
 * @see useFocusWithin, useFocusRing.
 */
export function useFocus(options: UseFocusOptions = {}): {
	/** Bound focus/blur handlers for the host — empty when `isDisabled`. */
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
	/** Focused state of the bound element. */
	isFocused: boolean
	/** Focused AND the tracked input modality is keyboard (web/AppKit).
	 * The default mobile tracker reports false. */
	isFocusVisible: boolean
	/** Whether this target tracks keyboard/pointer modality for focus rings. */
	isFocusVisibleSupported: boolean
	/** Bound focus/blur handlers to spread on the host. */
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
