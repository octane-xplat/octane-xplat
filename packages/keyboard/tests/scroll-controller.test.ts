import { expect, it, vi } from 'vitest'
import { unknownFocusedInputState } from '@octane-xplat/platform/focused-input-state'
const f = vi.hoisted(() => ({
	focus: null as any,
	keyboard: null as any,
	onFocus: (_: any) => {},
	onKeyboard: (_: any) => {},
	manual: () => {},
	writes: [] as number[],
	cleaned: 0,
	root: {},
}))

vi.mock('../src/focused-input', () => ({
	FocusedInputController: {
		getSnapshot: () => f.focus,
		recheck: () => f.onFocus(f.focus),
		subscribe: (_: any, read: any) => {
			f.onFocus = read
			read(f.focus)
			return () => f.cleaned++
		},
	},
}))

vi.mock('../src/controller', () => ({
	KeyboardController: {
		getSnapshot: () => f.keyboard,
		onMove: (_: any, read: any) => {
			f.onKeyboard = read
			read(f.keyboard)
			return () => f.cleaned++
		},
	},
}))

vi.mock('../src/scroll-runtime', () => ({
	scrollRuntime: {
		owner: () => f.root,
		read: () => f.focus.scrollOwners[0]?.offsetY ?? 248,
		write: (_: any, to: number) => f.writes.push(to),
		watchManual: (_: any, read: any) => {
			f.manual = read
			return () => f.cleaned++
		},
	},
}))

import { KeyboardScrollController } from '../src/scroll-controller'
const box = (y: number, height: number) => ({ x: 0, y, width: 300, height })
const setup = () => {
	f.cleaned = 0
	f.writes = []
	f.keyboard = { inset: 400, currentFrame: box(400, 400), windowRect: box(0, 800) }
	f.focus = {
		...unknownFocusedInputState(),
		input: {},
		inputRect: box(600, 40),
		windowRect: box(0, 800),
		scrollOwners: [{ id: f.root, rect: box(0, 800), offsetY: 0, minOffsetY: 0, maxOffsetY: 1000 }],
	}
}

it('pauses after a manual gesture and resumes on explicit recheck or selection change', () => {
	setup()
	const own = KeyboardScrollController.bind({})
	expect(f.writes.at(-1)).toBe(248)
	f.writes = []
	f.manual()
	f.focus = { ...f.focus, inputRect: box(650, 40) }
	f.onFocus(f.focus)
	expect(f.writes).toEqual([])
	own.recheck()
	expect(f.writes.at(-1)).toBe(298)
	f.manual()
	f.writes = []
	f.onFocus({ ...f.focus, selection: { start: 1, end: 1 } })
	expect(f.writes.length).toBe(1)
	own.release()
	own.release()
	expect(f.cleaned).toBe(3)
	own.recheck()
	expect(f.cleaned).toBe(3)
})

it('restores an owned offset on close, while preserving foreign/manual changes', () => {
	setup()
	const own = KeyboardScrollController.bind({}, { keyboardClose: 'restore' })
	f.focus = {
		...f.focus,
		inputRect: box(352, 40),
		scrollOwners: [{ ...f.focus.scrollOwners[0], offsetY: 248 }],
	}
	f.onFocus(f.focus)
	f.focus = unknownFocusedInputState()
	f.onFocus(f.focus)
	f.writes = []
	f.onKeyboard({ inset: 0, currentFrame: box(800, 0), windowRect: box(0, 800) })
	expect(f.writes).toEqual([0])
	own.release()
	setup()
	const next = KeyboardScrollController.bind({}, { keyboardClose: 'restore' })
	f.manual()
	f.writes = []
	f.onKeyboard({ inset: 0, currentFrame: box(800, 0), windowRect: box(0, 800) })
	expect(f.writes).toEqual([])
	next.release()
})

it('rolls back readers if initialization fails', () => {
	setup()
	f.focus = null
	expect(() => KeyboardScrollController.bind({})).toThrow()
	expect(f.cleaned).toBe(1)
})
