/** @jsxImportSource @nativescript-community/octane */
import { expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { Pressable } from './Pressable.macos.tsrx'
import { View } from './View.macos.tsrx'

it('AppKit Pressable forwards gestures, balances cancellation and suppresses disabled callbacks', () => {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const props = {
		onPress: vi.fn(),
		onLongPress: vi.fn(),
		onDoublePress: vi.fn(),
		onPressIn: vi.fn(),
		onPressOut: vi.fn(),
		onPan: vi.fn(),
		onSwipe: vi.fn(),
	}

	try {
		root.render(Pressable, props)
		flushUniversalSync(() => {})
		const host = container.children[0]
		container.dispatchEvent(host, 'tap', {})
		container.dispatchEvent(host, 'longPress', {})
		container.dispatchEvent(host, 'doubleTap', {})
		container.dispatchEvent(host, 'touch', { action: 'down' })
		container.dispatchEvent(host, 'touch', { action: 'move' })
		container.dispatchEvent(host, 'touch', { action: 'cancel' })
		const pan = { deltaX: 40, deltaY: 5, velocityX: 3, velocityY: 2, state: 3, view: host }
		container.dispatchEvent(host, 'pan', pan)
		container.dispatchEvent(host, 'swipe', { direction: 1 })
		for (const name of [
			'onPress',
			'onLongPress',
			'onDoublePress',
			'onPressIn',
			'onPressOut',
			'onSwipe',
		]) {
			expect(props[name]).toHaveBeenCalledTimes(1)
		}

		expect(props.onPan).toHaveBeenCalledWith({
			x: 40,
			y: 5,
			dx: 40,
			dy: 5,
			vx: 3,
			vy: 2,
			state: 'ended',
			target: host,
		})

		root.render(Pressable, { ...props, disabled: true })
		flushUniversalSync(() => {})
		for (const name of ['tap', 'longPress', 'doubleTap', 'touch', 'pan', 'swipe']) {
			expect(() => container.dispatchEvent(host, name, {})).toThrow('no')
		}

		expect(host.props.disabled).toBe(true)
		expect(host.props.accessibilityState.disabled).toBe(true)
		root.render(Pressable, props)
		flushUniversalSync(() => {})
		container.dispatchEvent(host, 'tap', {})
		expect(props.onPress).toHaveBeenCalledTimes(2)
	} finally {
		root.unmount()
	}
})

it('AppKit View retains pan normalization and forwards swipe without changing its payload', () => {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const onPan = vi.fn(),
		onSwipe = vi.fn()

	try {
		root.render(View, { onPan, onSwipe })
		flushUniversalSync(() => {})
		const host = container.children[0]
		container.dispatchEvent(host, 'pan', { deltaX: 0, deltaY: 0, state: 0, view: host })
		container.dispatchEvent(host, 'swipe', { direction: 4 })
		expect(onPan.mock.calls[0][0].state).toBe('cancelled')
		expect(onSwipe).toHaveBeenCalledWith({ direction: 4 })
	} finally {
		root.unmount()
	}
})
