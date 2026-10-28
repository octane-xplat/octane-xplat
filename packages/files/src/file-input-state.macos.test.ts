import { expect, it, vi } from 'vitest'
import { createAppKitFileInputState } from './file-input-state.macos'
import type { FileInputFile, FileInputProps } from './props'

const a = { name: 'a.txt', uri: 'file:///a.txt', size: 10 }, b = { name: 'b.pdf', uri: 'file:///b.pdf', size: 20 }
function deferred<T>() {
	let resolve!: (value: T) => void, reject!: (error: unknown) => void
	const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
	return { promise, resolve, reject }
}
function fixture(extra: Partial<FileInputProps> = {}) {
	let props: FileInputProps = { value: null, onChange: vi.fn(), ...extra }
	const publish = vi.fn(), picker = vi.fn(async () => a)
	const state = createAppKitFileInputState({ props: () => props, pick: picker, publish })
	return { state, publish, picker, props: () => props, update: (patch: Partial<FileInputProps>) => { props = { ...props, ...patch } } }
}
const idle = async (f: ReturnType<typeof fixture>) => { await vi.waitFor(() => expect(f.publish.mock.lastCall?.[0]).toBe(false)) }

it('claims picker and save synchronously, including reentry before a render can publish busy', async () => {
	const picked = deferred<FileInputFile | null>(), saved = deferred<void>()
	let reenter = () => {}
	const pick = vi.fn(() => picked.promise), change = vi.fn(() => reenter())
	const action = vi.fn(() => saved.promise), f = fixture({ pick, onChange: change, changeAction: action })
	reenter = () => { f.state.open(); f.state.clear() }
	f.state.open(); expect(pick).not.toHaveBeenCalled()
	f.state.attach(); f.state.open(); f.state.open()
	expect(pick).toHaveBeenCalledTimes(1)
	expect(f.publish.mock.lastCall?.[0]).toBe(true)
	picked.resolve(a)
	await vi.waitFor(() => expect(action).toHaveBeenCalledWith(a))
	f.state.open(); f.state.remove(a.uri)
	expect(pick).toHaveBeenCalledTimes(1)
	expect(change).toHaveBeenCalledTimes(1)
	expect(f.publish.mock.lastCall?.[0]).toBe(true)
	saved.resolve(); await idle(f)
})

it('validates and merges picker results against current values, constraints, mode and callback', async () => {
	const task = deferred<FileInputFile[]>(), original = vi.fn(), latest = vi.fn()
	const f = fixture({ value: [a], isMultiple: true, accept: '.pdf', pick: () => task.promise, onChange: original })
	f.state.attach(); f.state.open()
	f.update({ value: [b], accept: '.txt', maxSize: 15, onChange: latest })
	task.resolve([a]); await idle(f)
	expect(original).not.toHaveBeenCalled()
	expect(latest).toHaveBeenCalledWith([a]) // Existing b fails the latest accept constraint.
	expect(f.publish.mock.lastCall?.[1][0]).toContain('b.pdf: file type not accepted')
})

it('becoming blocked before a pick settles discards the result without changing selection', async () => {
	for (const patch of [{ isDisabled: true }, { isReadOnly: true }, { isLoading: true }]) {
		const task = deferred<FileInputFile | null>(), change = vi.fn(), f = fixture({ pick: () => task.promise, onChange: change })
		f.state.attach(); f.state.open(); f.update(patch); task.resolve(a); await idle(f)
		expect(change).not.toHaveBeenCalled()
		f.state.clear(); f.state.remove(a.uri); f.state.open()
		expect(f.publish.mock.lastCall?.[0]).toBe(false)
	}
})

it('synchronous picker/save failures become validation status and release the operation; cancellation keeps selection/errors', async () => {
	const change = vi.fn(), pick = vi.fn(() => { throw new Error('picker unavailable') })
	const f = fixture({ value: a, pick, onChange: change })
	f.state.attach(); f.state.open(); await idle(f)
	expect(f.publish.mock.lastCall?.[1]).toEqual(['picker unavailable'])
	f.update({ pick: async () => null }); f.state.open(); await idle(f)
	expect(change).not.toHaveBeenCalled()
	expect(f.publish.mock.lastCall?.[1]).toEqual(['picker unavailable'])
	f.update({ pick: async () => b, changeAction: () => { throw new Error('save failed') } })
	f.state.open(); await idle(f)
	expect(change).toHaveBeenCalledWith(b)
	expect(f.publish.mock.lastCall?.[1]).toEqual(['save failed'])
	f.update({ changeAction: undefined }); f.state.open(); await idle(f)
	expect(f.publish.mock.lastCall?.[1]).toEqual([])
})

it('detached picker completions cannot publish or clear a reattached newer operation', async () => {
	const old = deferred<FileInputFile | null>(), next = deferred<FileInputFile | null>(), change = vi.fn()
	const f = fixture({ pick: () => old.promise, onChange: change })
	f.state.attach(); f.state.open(); f.state.detach()
	const calls = f.publish.mock.calls.length
	f.state.open(); expect(f.publish).toHaveBeenCalledTimes(calls)
	f.update({ pick: () => next.promise }); f.state.attach(); f.state.open()
	old.resolve(a); await old.promise; await Promise.resolve()
	expect(change).not.toHaveBeenCalled()
	expect(f.publish.mock.lastCall?.[0]).toBe(true)
	next.resolve(b); await idle(f)
	expect(change).toHaveBeenCalledTimes(1); expect(change).toHaveBeenCalledWith(b)
})

it('removal follows file identity after reorder and clear uses the latest single/multiple value shape', async () => {
	const change = vi.fn(), f = fixture({ value: [a, b], isMultiple: true, onChange: change })
	const remove = () => f.state.remove(a.uri)
	f.state.attach(); f.update({ value: [b, a] }); remove(); await idle(f)
	expect(change).toHaveBeenLastCalledWith([b])
	f.update({ value: [b] }); remove(); await idle(f)
	expect(change).toHaveBeenCalledTimes(1)
	f.state.clear(); await idle(f); expect(change).toHaveBeenLastCalledWith([])
	f.update({ value: a, isMultiple: false }); f.state.clear(); await idle(f)
	expect(change).toHaveBeenLastCalledWith(null)
})

it('a detached save rejection cannot update status or fire another change', async () => {
	const saved = deferred<void>(), change = vi.fn(), f = fixture({ value: a, onChange: change, changeAction: () => saved.promise })
	f.state.attach(); f.state.clear(); expect(change).toHaveBeenCalledWith(null)
	f.state.detach(); const calls = f.publish.mock.calls.length
	saved.reject(new Error('late save')); await saved.promise.catch(() => {}); await Promise.resolve(); await Promise.resolve()
	expect(f.publish).toHaveBeenCalledTimes(calls)
	expect(change).toHaveBeenCalledTimes(1)
})

it('drop receive shares current validation, parent-owned values and the picker/save operation token', async () => {
	const saved = deferred<void>(), change = vi.fn(), f = fixture({ value: [a], isMultiple: true, onChange: change, changeAction: () => saved.promise })
	expect(f.state.receive([b])).toBe(false)
	f.state.attach(); expect(f.state.canReceive()).toBe(true)
	expect(f.state.receive([b])).toBe(true); expect(change).toHaveBeenCalledWith([a, b])
	expect(f.state.canReceive()).toBe(false); expect(f.state.receive([b])).toBe(false)
	f.state.open(); expect(f.picker).not.toHaveBeenCalled()
	saved.resolve(); await idle(f); expect(f.state.canReceive()).toBe(true)
	f.update({ value: a, isMultiple: false, accept: '.txt' }); change.mockClear()
	expect(f.state.receive([b])).toBe(true); await idle(f)
	expect(change).not.toHaveBeenCalled(); expect(f.publish.mock.lastCall?.[1][0]).toContain('b.pdf: file type not accepted')
})

it('drop receive rejects blocked, empty and detached operations and does not let a late save publish after detach', async () => {
	const saved = deferred<void>(), f = fixture({ changeAction: () => saved.promise })
	f.state.attach()
	for (const patch of [{ isDisabled: true }, { isReadOnly: true }, { isLoading: true }]) {
		f.update(patch); expect(f.state.receive([a])).toBe(false); expect(f.state.canReceive()).toBe(false)
		f.update({ isDisabled: false, isReadOnly: false, isLoading: false })
	}
	expect(f.state.receive([])).toBe(false); expect(f.state.receive([a])).toBe(true)
	f.state.detach(); const calls = f.publish.mock.calls.length
	saved.reject(new Error('late save')); await saved.promise.catch(() => {}); await Promise.resolve(); await Promise.resolve()
	expect(f.publish).toHaveBeenCalledTimes(calls); expect(f.state.receive([a])).toBe(false)
})
