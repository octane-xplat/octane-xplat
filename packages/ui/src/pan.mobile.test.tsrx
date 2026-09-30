/** @jsxImportSource @nativescript-community/octane */
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => ({
	Utils: { layout: { getDisplayDensity: () => 2 } },
}))

import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

import { usePan } from './pan.tsrx'
import type { PanEvent } from './props'

const events: PanEvent[] = []

function PanHost() @{
	const onPan = usePan((event) => events.push(event))

	<flexboxlayout id="pan-host" onPan={onPan} />
}

function mountPanHost() {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(PanHost as any, {})
	return { container, root, host: container.children[0] }
}

function nativeEvent(action: number) {
	return { getActionMasked: () => action }
}

function tracker() {
	return {
		addMovement: vi.fn(),
		computeCurrentVelocity: vi.fn(),
		getXVelocity: () => 800,
		getYVelocity: () => -240,
		recycle: vi.fn(),
	}
}

function installAndroid(trackerInstance: ReturnType<typeof tracker>) {
	vi.stubGlobal('android', {
		view: {
			MotionEvent: { ACTION_CANCEL: 3 },
			VelocityTracker: { obtain: () => trackerInstance },
		},
	})
}

afterEach(() => {
	events.length = 0
	vi.unstubAllGlobals()
})

describe('native pan normalization', () => {
	it('preserves Android ACTION_CANCEL as cancelled and clears release velocity', () => {
		const velocityTracker = tracker()
		installAndroid(velocityTracker)
		const { container, root, host } = mountPanHost()
		const target = { id: 'native-pan-target' }

		container.dispatchEvent(host, 'pan', {
			state: 1,
			deltaX: 0,
			deltaY: 0,
			android: { current: nativeEvent(2) },
			view: target,
		})

		container.dispatchEvent(host, 'pan', {
			// NativeScript's Android pan recognizer reports ended for both
			// ACTION_UP and ACTION_CANCEL; the MotionEvent disambiguates them.
			state: 3,
			deltaX: 40,
			deltaY: 0,
			android: { current: nativeEvent(3) },
			view: target,
		})

		expect(events.map((event) => event.state)).toEqual(['began', 'cancelled'])
		expect(events[1]).toMatchObject({ state: 'cancelled', vx: 0, vy: 0, target })
		expect(velocityTracker.recycle).toHaveBeenCalledOnce()
		expect(velocityTracker.addMovement).toHaveBeenCalledOnce()
		root.unmount()
	})

	it('keeps ACTION_UP ended and converts Android velocity from px/s to dip/s', () => {
		const velocityTracker = tracker()
		installAndroid(velocityTracker)
		const { container, root, host } = mountPanHost()

		container.dispatchEvent(host, 'pan', {
			state: 1,
			deltaX: 0,
			deltaY: 0,
			android: { current: nativeEvent(0) },
		})

		container.dispatchEvent(host, 'pan', {
			state: 3,
			deltaX: 40,
			deltaY: 0,
			android: { current: nativeEvent(1) },
		})

		expect(events.map((event) => event.state)).toEqual(['began', 'ended'])
		expect(events[1]).toMatchObject({ state: 'ended', vx: 400, vy: -120 })
		expect(velocityTracker.recycle).toHaveBeenCalledOnce()
		root.unmount()
	})
})
