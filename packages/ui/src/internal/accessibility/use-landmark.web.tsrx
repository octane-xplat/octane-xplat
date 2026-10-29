/** @jsxImportSource @octane-xplat/jsx/dom */
import { useRef } from 'octane'
import type { Octane } from 'octane/jsx-runtime'

/**
 * Landmark registration + keyboard region cycling — React Aria's
 * useLandmark. Returned landmarkProps spread onto a component or element:
 * accessibilityRole/accessibilityLabel carry the ARIA mapping our
 * primitives already own, ref registers the rendered element for
 * F6 / Shift+F6 region navigation. tabIndex=-1 is applied to the element
 * itself so an empty landmark can still take focus.
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

export interface LandmarkProps {
	accessibilityRole: string
	accessibilityLabel?: string
	ref?: Octane.Ref<any>
}

const TAB_STOP = 'a[href],button,input,textarea,select,[tabindex],[contenteditable="true"]'

const landmarks = new Set<HTMLElement>()
let attached = false

const ordered = (): HTMLElement[] =>
	[...landmarks].filter((el) => el.isConnected && el.ownerDocument === document)

const focusLandmark = (el: HTMLElement) => {
	const stop = el.querySelector<HTMLElement>(TAB_STOP)

	;(stop && stop.tabIndex >= 0 ? stop : el).focus()
}

const onKeyDown = (event: KeyboardEvent) => {
	if (event.key !== 'F6') {
		return
	}

	const els = ordered()
	if (!els.length) {
		return
	}

	event.preventDefault()
	const current = els.findIndex((el) => el.contains(document.activeElement))
	const next = current < 0 ? 0 : (current + (event.shiftKey ? -1 : 1) + els.length) % els.length

	focusLandmark(els[next])
}

const attach = () => {
	if (attached || typeof window === 'undefined') {
		return
	}

	attached = true
	window.addEventListener('keydown', onKeyDown, true)
}

export function useLandmark(options: UseLandmarkOptions): { landmarkProps: LandmarkProps } {
	attach()
	const current = useRef<HTMLElement | null>(null)
	const ref = (el: HTMLElement | null) => {
		if (current.current) {
			landmarks.delete(current.current)
		}

		current.current = el
		if (el) {
			el.tabIndex = -1
			landmarks.add(el)
		}
	}

	return {
		landmarkProps: {
			accessibilityRole: options.role,
			accessibilityLabel: options.label,
			ref,
		},
	}
}
