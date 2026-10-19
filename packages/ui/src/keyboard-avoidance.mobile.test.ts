import { expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({ readers: new Map<any, (state: any, window?: object) => void>() }))
vi.mock('./keyboard-inset', () => ({
	subscribeKeyboardState(listener: any, host: any) {
		mock.readers.set(host, listener)
		return () => mock.readers.delete(host)
	},
	keyboardHostOverlap: (host: any, state: any) =>
		Math.max(0, host.bottom - (state.currentFrame ?? state.targetFrame).y),
}))

import { bindKeyboardAvoidance } from './keyboard-avoidance'

const window = {}
const frame = (y: number) => ({ x: 0, y, width: 400, height: 800 - y })
const state = (current: number, target: number, phase = 'move') => ({
	windowRect: frame(0),
	currentFrame: frame(current),
	targetFrame: frame(target),
	inset: 800 - target,
	source: 'native-frames',
	motion: { phase },
})

it('writes native padding on every frame but publishes a stable nested avoidance claim', () => {
	const host = { bottom: 600 },
		content = { paddingBottom: 4 },
		claims: any[] = []
	const off = bindKeyboardAvoidance(host, content, { safeBottom: 0, ancestorBottom: 0 }, (claim) =>
		claims.push(claim),
	)
	const emit = mock.readers.get(host)!
	emit(state(800, 500, 'start'), window)
	emit(state(650, 500), window)
	emit(state(550, 500), window)
	expect(content.paddingBottom).toBe(54)
	emit(state(500, 500, 'end'), window)
	expect(content.paddingBottom).toBe(104)
	expect(claims).toEqual([{ window, bottom: 300 }])
	const nested = { bottom: 600 },
		child = { paddingBottom: 0 }
	const offNested = bindKeyboardAvoidance(
		nested,
		child,
		{ safeBottom: 0, ancestorWindow: window, ancestorBottom: 300 },
		() => {},
	)
	mock.readers.get(nested)!(state(500, 500, 'end'), window)
	expect(child.paddingBottom).toBe(0)
	emit(state(500, 800, 'start'), window)
	emit(state(650, 800), window)
	expect(claims).toHaveLength(1)
	emit(state(800, 800, 'end'), window)
	expect(claims.at(-1).bottom).toBe(0)
	expect(content.paddingBottom).toBe(4)
	offNested()
	off()
	off()
	expect(mock.readers.size).toBe(0)
})

it('preserves foreign padding changes and separates different windows', () => {
	const host = { bottom: 800 },
		content = { paddingBottom: 12 }
	const off = bindKeyboardAvoidance(
		host,
		content,
		{ safeBottom: 20, ancestorWindow: {}, ancestorBottom: 300, offset: 8 },
		() => {},
	)
	mock.readers.get(host)!(state(500, 500, 'end'), window)
	expect(content.paddingBottom).toBe(300)
	content.paddingBottom = 50
	off()
	expect(content.paddingBottom).toBe(50)
})

it('updates offsets without replacing the live observer or viewport ownership', () => {
	const host = { bottom: 800 }, content = { paddingBottom: 0 }
	let options = { safeBottom: 0, ancestorBottom: 0, offset: 8 }
	const binding = bindKeyboardAvoidance(host, content, () => options, () => {})
	const observer = mock.readers.get(host)!
	observer(state(500, 500, 'end'), window)
	expect(content.paddingBottom).toBe(308)
	options = { ...options, offset: 16 }
	binding.update()
	expect(content.paddingBottom).toBe(316)
	expect(mock.readers.get(host)).toBe(observer)
	binding()
	expect(content.paddingBottom).toBe(0)
})
