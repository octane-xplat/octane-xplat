// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { createRoot, flushSync } from 'octane'
import type { PermissionHookOptions, PermissionResponse } from '../src/types'
const native = vi.hoisted(() => ({
	read: vi.fn(),
	request: vi.fn(),
	advertisingId: () => null,
	advertisingIdAsync: async () => null,
	capabilities: () => ({ prompt: true, advertisingId: true, advertisingIdAsync: true }),
}))
vi.mock('../src/backend', () => ({ backend: native }))
import { useTrackingPermissions } from '../src/use-tracking-permissions'
const roots: Array<ReturnType<typeof createRoot>> = []
afterEach(() => {
	for (const root of roots.splice(0)) {
		root.unmount()
	}
	document.body.replaceChildren()
	vi.clearAllMocks()
})
function deferred<T>() {
	let resolve!: (value: T) => void
	const promise = new Promise<T>((done) => {
		resolve = done
	})
	return { promise, resolve }
}
function mount() {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push(root)
	let state!: [
			PermissionResponse | null,
			() => Promise<PermissionResponse>,
			() => Promise<PermissionResponse>,
		],
		renders = 0
	function Consumer(props: PermissionHookOptions) {
		renders++
		state = useTrackingPermissions(props)
		return null
	}
	return {
		root,
		state: () => state,
		renders: () => renders,
		render: (props: PermissionHookOptions) => flushSync(() => root.render(Consumer, props)),
	}
}
it('reads on mount without prompting and requests only through the returned method', async () => {
	native.read.mockReturnValue(0)
	native.request.mockResolvedValue(3)
	const view = mount()
	view.render({})
	await vi.waitFor(() => expect(view.state()[0]?.status).toBe('undetermined'))
	expect(native.request).not.toHaveBeenCalled()
	await view.state()[1]()
	await vi.waitFor(() => expect(view.state()[0]?.status).toBe('granted'))
	expect(native.request).toHaveBeenCalledOnce()
})
it('ignores an old response and never updates a disposed reader', async () => {
	const prompt = deferred<number>()
	native.read.mockReturnValue(0)
	native.request.mockReturnValueOnce(prompt.promise)
	const view = mount()
	view.render({ get: false })
	expect(native.read).not.toHaveBeenCalled()
	const pending = view.state()[1]()
	await view.state()[2]()
	await vi.waitFor(() => expect(view.state()[0]?.status).toBe('undetermined'))
	prompt.resolve(3)
	await pending
	await new Promise((done) => setTimeout(done, 10))
	expect(view.state()[0]?.status).toBe('undetermined')
	const later = deferred<number>()
	native.request.mockReturnValueOnce(later.promise)
	const last = view.state()[1](),
		count = view.renders()
	view.root.unmount()
	later.resolve(2)
	await last
	await new Promise((done) => setTimeout(done, 10))
	expect(view.renders()).toBe(count)
})
it('rejects automatic request options before any request can be dispatched', () => {
	const view = mount()
	expect(() => view.render({ request: true } as never)).toThrow('explicit action')
	expect(native.request).not.toHaveBeenCalled()
})

it('keeps an immediate explicit action ahead of the default mount read', async () => {
	native.read.mockReturnValue(0)
	native.request.mockResolvedValue(3)
	const view = mount()
	view.render({})
	await view.state()[1]()
	await vi.waitFor(() => expect(view.state()[0]?.status).toBe('granted'))
	await new Promise((done) => setTimeout(done, 25))
	expect(view.state()[0]?.status).toBe('granted')
})
