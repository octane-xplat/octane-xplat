/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { useImperativeHandle, useMemo, useRef } from 'octane'
import { useMeasure } from './useMeasure.tsrx'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import type { TextInputHandle, ViewProps } from './props'
import type { Octane } from 'octane/jsx-runtime'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))
vi.mock('./escape-props', () => ({ applyEscapeProps() {}, nativeAccessibilityState() {}, nativeAccessibilityRole() {} }))

import { View } from './View.tsrx'
import { TextInput } from './TextInput.tsrx'
import { AspectRatio } from './AspectRatio.tsrx'

function RefFixture(props: { viewRef?: ViewProps['ref']; inputRef?: Octane.Ref<TextInputHandle> }) @{
	<View ref={props.viewRef}>
		<TextInput ref={props.inputRef} />
	</View>
}

function ImperativeFixture(props: { ref?: Octane.Ref<{ ready: boolean }> }) @{
	useImperativeHandle(props.ref, () => ({ ready: true }), [])

	<flexboxlayout />
}

function MeasuredFixture() @{
	const measurement = useMeasure()

	<View ref={measurement.ref}><label text={measurement.bounds?.width} /></View>
}

describe('standard component refs on the universal renderer', () => {
	it('keeps composed measurement refs stable through layout updates', () => {
		const container = createObjectContainer('nativescript')
		const driver = createObjectDriver('nativescript')
		const instance = driver.getPublicInstance.bind(driver)
		driver.getPublicInstance = (container, id) => {
			const host: any = instance(container, id)
			host.isLoaded = true
			host.getLocationOnScreen = () => ({ x: 0, y: 0 })
			host.getActualSize = () => ({ width: 100, height: 50 })
			return host
		}

		const root = createUniversalRoot(container, driver)
		const ref = { current: null as any }
		try {
			flushUniversalSync(() => root.render(AspectRatio, { ratio: 2, ref }))
			expect(ref.current?.type).toBe('flexboxlayout')
			flushUniversalSync(() => root.render(MeasuredFixture, {}))
		} finally {
			root.unmount()
		}

		expect(ref.current).toBeNull()
	})

	it('forwards hosts and handles, replaces refs, and clears on unmount', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const view = { current: null as any }
		const input = { current: null as TextInputHandle | null }
		const next = { current: null as TextInputHandle | null }
		const cleanup = vi.fn()
		const callback = vi.fn(() => cleanup)
		try {
			flushUniversalSync(() => root.render(RefFixture, { viewRef: view, inputRef: [input, [callback, undefined]] }))
			expect(view.current?.type).toBe('flexboxlayout')
			expect(input.current?.native?.type).toBe('textfield')
			expect(callback).toHaveBeenCalledExactlyOnceWith(input.current)
			flushUniversalSync(() => root.render(RefFixture, { viewRef: view, inputRef: next }))
			expect(input.current).toBeNull()
			expect(next.current?.native?.type).toBe('textfield')
			expect(cleanup).toHaveBeenCalledTimes(1)
			expect(callback).toHaveBeenCalledTimes(1)
		} finally {
			root.unmount()
		}

		expect(view.current).toBeNull()
		expect(next.current).toBeNull()
	})

	it('reattaches an imperative handle when only the ref changes', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const previous = { current: null as { ready: boolean } | null }
		const next = vi.fn()
		flushUniversalSync(() => root.render(ImperativeFixture, { ref: previous }))
		expect(previous.current).toEqual({ ready: true })
		flushUniversalSync(() => root.render(ImperativeFixture, { ref: next }))
		expect(previous.current).toBeNull()
		expect(next).toHaveBeenCalledExactlyOnceWith({ ready: true })
		root.unmount()
		expect(next.mock.calls.at(-1)).toEqual([null])
	})
})
