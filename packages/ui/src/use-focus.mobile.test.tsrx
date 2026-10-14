/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))

import { useFocus, useFocusRing } from './use-focus.tsrx'
import { useFocusVisible } from './use-focus-visible.tsrx'
import { useFocusWithin } from './use-focus-within.tsrx'
import { useLandmark } from './use-landmark.tsrx'
import { FocusScope, getFocusScopeCapabilities } from './FocusScope.tsrx'

// Native lane — modality and landmark cycling are web conventions, so the
// leaves keep API shape with constant/inert results. Handlers from
// useFocus/useFocusWithin still compose and fire their callbacks.

let captured: any

const Probe = (props: any) => @{
	const { focusProps } = useFocus({ onFocusChange: props.onChange })
	const ring = useFocusRing()
	const { isFocusVisible } = useFocusVisible()
	const within = useFocusWithin({ onFocusWithinChange: props.onWithin })
	const { landmarkProps } = useLandmark({ role: 'main', label: 'Content' })
	captured = { focusProps, ring, isFocusVisible, focusWithinProps: within.focusWithinProps, within, landmarkProps }

	<label text="probe" />
}

describe('focus hooks (universal renderer)', () => {
	it('exposes focus callbacks and constant modality on native', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const onChange = vi.fn()
		const onWithin = vi.fn()
		root.render(Probe as any, { onChange, onWithin })

		expect(captured.isFocusVisible).toBe(false)
		expect(captured.ring.isFocused).toBe(false)
		expect(captured.ring.isFocusVisible).toBe(false)

		captured.focusProps.onFocus()
		expect(onChange).toHaveBeenLastCalledWith(true)
		captured.focusProps.onBlur()
		expect(onChange).toHaveBeenLastCalledWith(false)
		expect(captured.within.isSubtreeTrackingSupported).toBe(false)
		captured.focusWithinProps.onFocus()
		expect(onWithin).toHaveBeenLastCalledWith(true)
		captured.focusWithinProps.onBlur()
		expect(onWithin).toHaveBeenLastCalledWith(false)

		expect(captured.landmarkProps.accessibilityRole).toBe('main')
		expect(captured.landmarkProps.accessibilityLabel).toBe('Content')
		root.unmount()
	})

	it('FocusScope renders an accessible container; behavior flags are inert', () => {
		expect(getFocusScopeCapabilities()).toEqual({
			contain: false,
			autoFocus: false,
			restoreFocus: false,
		})

		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(FocusScope as any, {
			contain: true,
			autoFocus: true,
			restoreFocus: true,
			accessibilityLabel: 'Scoped',
		})

		const host = container.children[0]
		expect(host.props.accessibilityLabel).toBe('Scoped')
		root.unmount()
	})
})
