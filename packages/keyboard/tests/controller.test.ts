import { afterEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({
	readers: new Set<(state: any) => void>(),
	activations: 0,
	throwSubscribe: false,
	state: {} as any,
}))

vi.mock('../src/runtime', () => ({
	keyboardRuntime: {
		activate() {
			mock.activations++
			let active = true
			return () => {
				if (active) {
					active = false
					mock.activations--
				}
			}
		},
		subscribe(_host: object, listener: (state: any) => void) {
			if (mock.throwSubscribe) {
				throw new Error('attachment failed')
			}
			mock.readers.add(listener)
			listener(mock.state)
			return () => mock.readers.delete(listener)
		},
		getSnapshot: () => mock.state,
		property: (host: any) => ({
			read: () => host.translateY,
			write: (value: number) => {
				host.translateY = value
			},
		}),
		overlap(host: any, state: any, owned: number) {
			const frame = state.currentFrame ?? state.targetFrame
			return frame ? Math.max(0, host.bottom + host.translateY - owned - frame.y) : 0
		},
	},
}))

import { KeyboardController, bindKeyboardHost } from '../src/controller'

const rect = (y: number, height = 800 - y) => ({ x: 0, y, width: 400, height })
const frame = (current: number, target: number, phase = 'move') => ({
	inset: 800 - target,
	windowRect: rect(0),
	currentFrame: rect(current),
	targetFrame: rect(target),
	source: 'native-frames',
	motion: {
		phase,
		transitionId: 1,
		timestampMs: 10,
		durationMs: 300,
		nativeFrames: true,
		interactive: false,
		floating: false,
	},
})

const emit = (state: any) => {
	mock.state = state
	mock.readers.forEach((reader) => reader(state))
}

afterEach(() => {
	expect(mock.activations).toBe(0)
	expect(mock.readers.size).toBe(0)
	mock.throwSubscribe = false
})

describe('keyboard controller', () => {
	it('keeps next-refresh estimates private while native bindings use them', () => {
		mock.state = frame(800, 800, 'idle')
		const host = { translateY: 0, bottom: 800 }
		const release = bindKeyboardHost(host)
		const moves: any[] = []
		const off = KeyboardController.onMove(host, (value) => moves.push(value))
		emit({ ...frame(700, 500), bindingFrame: rect(650) })
		expect(host.translateY).toBe(-150)
		expect(moves.at(-1).currentFrame.y).toBe(700)
		expect('bindingFrame' in moves.at(-1)).toBe(false)
		off()
		release()
	})

	it('reads a stable cached snapshot without activating observation', () => {
		mock.state = frame(800, 800, 'idle')
		const host = {}
		expect(KeyboardController.getSnapshot(host)).toBe(KeyboardController.getSnapshot(host))
		expect(KeyboardController.getSnapshot(host).capabilities.nativeFrames).toBe(true)
		expect(mock.activations).toBe(0)
	})

	it('separates measured movement from destination and lifecycle subscribers', () => {
		mock.state = frame(800, 800, 'idle')
		const states: string[] = [],
			moves: number[] = []
		const offState = KeyboardController.subscribe({}, (state) => states.push(state.phase))
		const offMove = KeyboardController.onMove({}, (state) => moves.push(state.currentFrame!.y))
		emit(frame(800, 500, 'start'))
		emit(frame(700, 500))
		emit(frame(600, 500))
		emit(frame(500, 500, 'end'))
		expect(states).toEqual(['idle', 'start', 'end'])
		expect(moves).toEqual([800, 800, 700, 600, 500])
		offState()
		offState()
		offMove()
	})

	it('binds measured frames, shares a host property, and restores the final owner baseline', () => {
		mock.state = frame(800, 800, 'idle')
		const host = { translateY: 12, bottom: 788 }
		const first = bindKeyboardHost(host)
		emit(frame(700, 500))
		expect(host.translateY).toBe(-88)
		const second = bindKeyboardHost(host)
		expect(mock.readers.size).toBe(1)
		expect(host.translateY).toBe(-88)
		emit(frame(500, 500, 'end'))
		expect(host.translateY).toBe(-288)
		first()
		expect(host.translateY).toBe(-288)
		second()
		expect(host.translateY).toBe(12)
	})

	it('follows interrupted/reversed measurements without jumping to the destination', () => {
		mock.state = frame(800, 800, 'idle')
		const host = { translateY: 0, bottom: 800 },
			release = bindKeyboardHost(host)
		emit(frame(800, 500, 'start'))
		expect(host.translateY).toBe(0)
		emit(frame(650, 500))
		expect(host.translateY).toBe(-150)
		emit(frame(650, 500, 'cancel'))
		expect(host.translateY).toBe(-150)
		emit(frame(650, 800, 'start'))
		expect(host.translateY).toBe(-150)
		emit(frame(750, 800))
		expect(host.translateY).toBe(-50)
		emit(frame(800, 800, 'end'))
		expect(host.translateY).toBe(0)
		release()
	})

	it('keeps newer foreign transforms on release and remains inert when disabled', () => {
		mock.state = frame(500, 500, 'end')
		const host = { translateY: 0, bottom: 800 }
		const disabled = bindKeyboardHost(host, { enabled: false })
		expect(mock.readers.size).toBe(0)
		disabled()
		const release = bindKeyboardHost(host)
		host.translateY = 50
		release()
		expect(host.translateY).toBe(50)
	})

	it('does not add a duplicate keyboard shift to an already resized host', () => {
		mock.state = frame(500, 500, 'end')
		const host = { translateY: 0, bottom: 500 },
			release = bindKeyboardHost(host)
		expect(host.translateY).toBe(0)
		release()
	})

	it('updates offsets and consumed space without replacing a running source', () => {
		mock.state = frame(800, 800, 'idle')
		const host = { translateY: 0, bottom: 800 }
		let options = { openOffset: 10, closedOffset: 2, consumedBottom: 34 }
		const release = bindKeyboardHost(host, () => options)
		expect(host.translateY).toBe(-2)
		emit(frame(650, 500))
		expect(host.translateY).toBe(-156)
		options = { openOffset: 20, closedOffset: 2, consumedBottom: 200 }
		release.update()
		expect(host.translateY).toBe(-111)
		expect(mock.activations).toBe(1)
		expect(mock.readers.size).toBe(1)
		emit(frame(500, 500, 'end'))
		expect(host.translateY).toBe(-120)
		release()
		expect(host.translateY).toBe(0)
		release.update()
		expect(host.translateY).toBe(0)
	})

	it('fully clears occlusion when a baseline transform extends below the window', () => {
		mock.state = frame(500, 500, 'end')
		const host = { translateY: 12, bottom: 800 }
		const release = bindKeyboardHost(host, { openOffset: 8 })
		expect(host.translateY).toBe(-308)
		release()
		expect(host.translateY).toBe(12)
	})

	it('releases activation when adapter attachment fails', () => {
		mock.throwSubscribe = true
		expect(() => KeyboardController.onMove({}, () => {})).toThrow('attachment failed')
	})
})
