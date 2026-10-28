/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { TimeInput } from './TimeInput.macos.tsrx'

afterEach(() => vi.useRealTimers())
function mount(extra: any = {}) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const flush = () => flushUniversalSync(() => {})
	const base = { id: 'starts', value: '14:30', hourFormat: '24h', increment: 15, ...extra }
	const render = (props: any) => { root.render(TimeInput, props); flush() }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const input = () => all().find((node) => node.type === 'textfield')
	const key = (name: string, extra: any = {}, handler = input().props.onKeyDown) => {
		let prevented = false, stopped = false
		handler({ key: name, target: input(), preventDefault() { prevented = true }, stopPropagation() { stopped = true }, ...extra })
		flush(); return { prevented, stopped }
	}
	render(base)
	return { root, base, render, input, key, flush }
}
it('steps committed values by minutes, preserves seconds and asks the parent before changing display', () => {
	const changed = vi.fn(), env = mount({ value: '14:30:17', hasSeconds: true, onChange: changed })
	try {
		expect(env.key('ArrowUp')).toEqual({ prevented: true, stopped: true })
		expect(changed).toHaveBeenLastCalledWith('14:45:17'); expect(env.input().props.value).toBe('14:30:17')
		env.render({ ...env.base, value: '14:45:17' })
		expect(env.input().props.value).toBe('14:45:17')
		env.key('ArrowDown'); expect(changed).toHaveBeenLastCalledWith('14:30:17')
		env.render({ ...env.base, value: '23:55:17', increment: 10 })
		env.key('ArrowUp'); expect(changed).toHaveBeenLastCalledWith('00:05:17')
	} finally { env.root.unmount() }
})
it('uses current bounds, rejects blocked/detached handlers and preserves modified or composing input', () => {
	const changed = vi.fn(), env = mount({ min: '14:30', max: '14:45', onChange: changed })
	try {
		const handler = env.input().props.onKeyDown
		expect(env.key('ArrowDown').prevented).toBe(true); expect(changed).not.toHaveBeenCalled()
		for (const extra of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { defaultPrevented: true }, { isComposing: true }, { target: {} }]) {
			expect(env.key('ArrowUp', extra).prevented).toBe(false)
		}
		env.input().currentEditor = { hasMarkedText: () => true }
		expect(env.key('ArrowUp').prevented).toBe(false)
		env.input().currentEditor = null
		for (const block of [{ isDisabled: true }, { isReadOnly: true }, { isLoading: true }]) {
			env.render({ ...env.base, ...block }); expect(env.key('ArrowUp', {}, handler).prevented).toBe(false)
		}
		env.render({ ...env.base, max: '14:35' }); env.key('ArrowUp', {}, handler); expect(changed).not.toHaveBeenCalled()
		env.root.unmount(); expect(env.key('ArrowUp', {}, handler).prevented).toBe(false)
	} finally { env.root.unmount() }
})
it('seeds an empty value from local current time and replaces a private draft only after an accepted step', () => {
	vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 2, 5, 9, 20, 11))
	const changed = vi.fn(), env = mount({ value: null, onChange: changed })
	try {
		env.key('ArrowUp'); expect(changed).toHaveBeenLastCalledWith('09:35')
		env.render({ ...env.base, value: '09:35' })
		env.input().props.onTextChange('invalid'); env.flush(); expect(env.input().props.value).toBe('invalid')
		env.key('ArrowDown'); expect(changed).toHaveBeenLastCalledWith('09:20')
		expect(env.input().props.value).toBe('09:35') // Parent has not echoed the request.
	} finally { env.root.unmount() }
})
it('claims before reentrant onChange and holds the action guard through settlement without rolling back the parent', async () => {
	let resolve!: () => void, repeat = () => {}, calls = 0
	const save = vi.fn(() => new Promise<void>((done) => { resolve = done }))
	const changed = vi.fn(() => { if (++calls === 1) repeat() }), env = mount({ onChange: changed, changeAction: save })
	try {
		const handler = env.input().props.onKeyDown
		repeat = () => { env.render({ ...env.base, label: 'Reentered' }); env.key('ArrowUp', {}, handler) }
		env.key('ArrowUp'); env.key('ArrowUp', {}, handler)
		expect(changed).toHaveBeenCalledTimes(1); expect(save).toHaveBeenCalledTimes(1)
		expect(env.input().props.editable).toBe(false)
		resolve(); await vi.waitFor(() => { env.flush(); expect(env.input().props.editable).toBe(true) })
		env.render({ ...env.base, value: '14:45', changeAction: () => { throw Error('offline') } })
		env.key('ArrowDown'); await vi.waitFor(() => { env.flush(); expect(env.input().props.editable).toBe(true) })
		expect(changed).toHaveBeenLastCalledWith('14:30'); expect(env.input().props.value).toBe('14:45')
		env.render({ ...env.base, value: '14:45', changeAction: () => Promise.reject(Error('offline')) })
		env.key('ArrowDown'); await vi.waitFor(() => { env.flush(); expect(env.input().props.editable).toBe(true) })
		expect(env.input().props.value).toBe('14:45')
	} finally { env.root.unmount() }
})
it('releases a throwing forward callback and completes an accepted save after callback teardown', async () => {
	const env = mount({ onChange: () => { throw Error('forward') } })
	try {
		expect(() => env.key('ArrowUp')).toThrow('forward')
		const changed = vi.fn(); env.render({ ...env.base, onChange: changed }); env.key('ArrowUp'); expect(changed).toHaveBeenCalledTimes(1)
		let settle!: () => void
		const save = vi.fn(() => new Promise<void>((done) => { settle = done }))
		env.render({ ...env.base, onChange: () => env.root.unmount(), changeAction: save })
		env.key('ArrowDown'); expect(save).toHaveBeenCalledWith('14:15'); settle(); await Promise.resolve(); env.flush()
	} finally { env.root.unmount() }
})
