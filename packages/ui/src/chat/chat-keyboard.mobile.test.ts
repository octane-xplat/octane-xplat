import { afterEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({
	reader: null as any,
	state: null as any,
	viewportLeases: 0,
	key: {},
}))

vi.mock('../internal/keyboard/keyboard-inset', () => ({
	subscribeKeyboardState(read: any) {
		mock.reader = read
		read(mock.state, mock.key)
		return () => {
			mock.reader = null
		}
	},
	keyboardHostDisplacement(host: any, state: any, owned: number) {
		return Math.max(
			0,
			host.bottom + host.translateY - owned - (state.currentFrame ?? state.targetFrame).y,
		)
	},
}))

vi.mock('@octane-xplat/platform/keyboard-viewport', () => ({
	observeKeyboardViewport() {
		mock.viewportLeases++
		return {
			update() {},
			release() {
				mock.viewportLeases--
			},
		}
	},
}))

import { bindChatKeyboard } from './chat-keyboard'
import { registerChatScrollControl, chatViewportMoving } from './chat-scroll-state'
const rect = (y: number) => ({ x: 0, y, width: 400, height: 800 - y })
const frame = (y: number, phase = 'end', target = y) => ({
	windowRect: rect(0),
	inset: 800 - target,
	currentFrame: rect(y),
	targetFrame: rect(target),
	source: 'native-frames',
	motion: { phase, transitionId: target === 800 ? 2 : 1, nativeFrames: true },
})

const fixture = (policy: 'never' | 'always' | 'when-at-end' = 'when-at-end') => {
	vi.useFakeTimers()
	mock.state = frame(800)
	const dock: any = {
		bottom: 800,
		translateY: 0,
		height: 80,
		getActualSize() {
			return { height: this.height }
		},
		on(name: string, cb: any) {
			this.changed = cb
		},
		off() {
			this.changed = null
		},
	}
	const dockPad: any = {
		style: { paddingBottom: 0 },
	}
	const content: any = {
		style: { paddingBottom: 10 },
		on(name: string, cb: any) {
			this.changed = cb
		},
		off() {
			this.changed = null
		},
	}
	const readers = new Set<() => void>()
	const viewport: any = {
		scrollTop: 0,
		clientHeight: 800,
		get scrollHeight() {
			return 1800 + content.style.paddingBottom
		},
		get scrollableHeight() {
			return Math.max(0, this.scrollHeight - this.clientHeight)
		},
		getActualSize() {
			return { height: 800 }
		},
		on(_name: string, cb: any) {
			readers.add(cb)
		},
		off(_name: string, cb: any) {
			readers.delete(cb)
		},
		scrollTo: vi.fn(function (this: any, options: any) {
			if (options?.top != null) {
				this.scrollTop = options.top
				for (const cb of readers) {
					cb()
				}
			}
		}),
	}
	let following = true
	const unregister = registerChatScrollControl(viewport, {
		isFollowing: () => following,
		jumpToEnd: () => viewport.scrollTo({ top: viewport.scrollableHeight, behavior: 'instant' }),
	})
	const options: any = { keyboardFollow: policy, bottomPanelHeight: 0 }
	const binding = bindChatKeyboard({}, viewport, dock, dockPad, content, () => options)
	vi.runAllTimers()
	return {
		dock,
		dockPad,
		content,
		viewport,
		options,
		binding,
		emit(state: any) {
			mock.state = state
			mock.reader(state, mock.key)
			vi.runAllTimers()
		},
		manual(offset: number) {
			following = false
			viewport.scrollTo({ top: offset })
		},
		close() {
			binding()
			unregister()
			expect(readers.size).toBe(0)
			expect(vi.getTimerCount()).toBe(0)
		},
	}
}

afterEach(() => {
	expect(mock.viewportLeases).toBe(0)
	vi.useRealTimers()
})

it('follows only an existing end position and counts dock/keyboard range once', () => {
	const f = fixture()
	f.emit(frame(500))
	expect(f.dock.translateY).toBe(-300)
	expect(f.content.style.paddingBottom).toBe(390)
	expect(f.viewport.scrollTop).toBe(1390)
	expect(f.viewport.scrollTo).toHaveBeenCalledWith({ top: 1390, behavior: 'instant' })
	f.manual(400)
	f.emit(frame(400))
	expect(f.viewport.scrollTop).toBe(400)
	f.close()
	expect(f.dock.translateY).toBe(0)
	expect(f.content.style.paddingBottom).toBe(10)
})

it('never preserves history while always explicitly follows from history', () => {
	const never = fixture('never')
	const old = never.viewport.scrollTop
	never.emit(frame(500))
	expect(never.viewport.scrollTop).toBe(old)
	never.close()
	const always = fixture('always')
	always.manual(400)
	always.emit(frame(500))
	expect(always.viewport.scrollTop).toBe(always.viewport.scrollableHeight)
	expect(always.viewport.scrollTo).toHaveBeenCalledWith({
		top: always.viewport.scrollableHeight,
		behavior: 'instant',
	})
	always.close()
})

it('matching custom panel replaces keyboard range without shifting the end', () => {
	const f = fixture()
	f.emit(frame(500))
	const before = f.viewport.scrollTop
	f.options.bottomPanelHeight = 300
	f.dock.height = 380
	f.binding.update()
	vi.runAllTimers()
	expect(f.content.style.paddingBottom).toBe(390)
	expect(f.viewport.scrollTop).toBe(before)
	expect(f.dock.translateY).toBe(0)
	f.emit(frame(800))
	expect(f.content.style.paddingBottom).toBe(390)
	expect(f.viewport.scrollTop).toBe(before)
	f.close()
})

it('manual movement cancels queued keyboard follow and motion suppresses another animation', () => {
	const f = fixture()
	mock.reader(frame(750, 'move', 500), mock.key)
	expect(chatViewportMoving(f.viewport)).toBe(true)
	f.manual(400)
	vi.runAllTimers()
	expect(f.viewport.scrollTop).toBe(400)
	f.emit(frame(500))
	expect(chatViewportMoving(f.viewport)).toBe(false)
	f.close()
})

it('composer growth follows the existing stream lock independently of keyboard policy', () => {
	const f = fixture('never')
	const before = f.viewport.scrollTop
	f.dock.height = 140
	f.dock.changed()
	vi.runAllTimers()
	expect(f.viewport.scrollTop).toBe(before + 60)
	f.manual(400)
	f.dock.height = 180
	f.dock.changed()
	vi.runAllTimers()
	expect(f.viewport.scrollTop).toBe(400)
	f.close()
})

it('measures composer growth after NativeScript completes the child layout pass', () => {
	const f = fixture('never')
	const before = f.viewport.scrollTop
	f.dock.isLayoutValid = false
	f.dock.height = 140
	f.dock.changed()
	expect(f.content.style.paddingBottom).toBe(90)
	f.dock.isLayoutValid = true
	vi.runAllTimers()
	expect(f.content.style.paddingBottom).toBe(150)
	expect(f.viewport.scrollTop).toBe(before + 60)
	f.close()
})

it('pads the dock over the home indicator only while neither keyboard nor panel covers it', () => {
	const f = fixture()
	f.options.homeInset = 34
	f.binding.update()
	vi.runAllTimers()
	expect(f.dockPad.style.paddingBottom).toBe(34)
	expect(f.dock.translateY).toBe(0)
	f.emit(frame(790))
	expect(f.dockPad.style.paddingBottom).toBe(24)
	expect(f.dock.translateY).toBe(-10)
	f.emit(frame(472))
	expect(f.dockPad.style.paddingBottom).toBe(0)
	expect(f.dock.translateY).toBe(-328)
	f.emit(frame(800))
	f.options.bottomPanelHeight = 328
	f.dock.height = 408
	f.binding.update()
	vi.runAllTimers()
	expect(f.dockPad.style.paddingBottom).toBe(0)
	expect(f.dock.translateY).toBe(0)
	f.close()
	expect(f.dockPad.style.paddingBottom).toBe(0)
})

it('leaves the dock un-padded when an ancestor already consumed the home inset', () => {
	const f = fixture()
	f.options.homeInset = 0
	f.binding.update()
	vi.runAllTimers()
	expect(f.dockPad.style.paddingBottom).toBe(0)
	f.close()
})
