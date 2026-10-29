// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { createRoot, flushSync } from 'octane'
import type { PermissionHookOptions, PermissionResponse } from '../src/types'
const native = vi.hoisted(() => ({ permissions: vi.fn(), isAvailable: () => true }))
vi.mock('../src/backend', () => ({ backend: native }))
import { usePermissions } from '../src/use-permissions'
const granted: PermissionResponse = {
	status: 'granted',
	granted: true,
	canAskAgain: true,
	expires: 'never',
	accessPrivileges: 'all',
}
const denied: PermissionResponse = {
	status: 'denied',
	granted: false,
	canAskAgain: false,
	expires: 'never',
	accessPrivileges: 'none',
}
const roots: Array<ReturnType<typeof createRoot>> = []
afterEach(() => {
	for (const root of roots.splice(0)) {
		root.unmount()
	}
	document.body.replaceChildren()
	vi.clearAllMocks()
})
function deferred() {
	let resolve!: (value: PermissionResponse) => void
	const promise = new Promise<PermissionResponse>((done) => {
		resolve = done
	})
	return { promise, resolve }
}
function mount() {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push(root)
	let state!: ReturnType<typeof usePermissions>,
		renders = 0
	function Consumer(props: PermissionHookOptions) {
		renders++
		state = usePermissions(props)
		return null
	}
	const render = (props: PermissionHookOptions) => flushSync(() => root.render(Consumer, props))
	return { render, root, state: () => state, renders: () => renders }
}
it('keeps a later permission request from being overwritten by an earlier read', async () => {
	const read = deferred(),
		request = deferred()
	native.permissions.mockImplementation((prompt: boolean) =>
		prompt ? request.promise : read.promise,
	)
	const view = mount()
	view.render({})
	await vi.waitFor(() => expect(native.permissions).toHaveBeenCalledWith(false, false, undefined))
	const pending = view.state()[1]()
	request.resolve(granted)
	await pending
	await vi.waitFor(() => expect(view.state()[0]).toEqual(granted))
	read.resolve(denied)
	await new Promise((done) => setTimeout(done, 25))
	expect(view.state()[0]).toEqual(granted)
})
it('rejects stale option results and leaves disposed components alone', async () => {
	const first = deferred(),
		second = deferred(),
		request = deferred()
	native.permissions.mockImplementation((prompt: boolean, writeOnly: boolean) =>
		prompt ? request.promise : writeOnly ? second.promise : first.promise,
	)
	const view = mount()
	view.render({ writeOnly: false })
	await vi.waitFor(() => expect(native.permissions).toHaveBeenCalledTimes(1))
	view.render({ writeOnly: true })
	await vi.waitFor(() => expect(native.permissions).toHaveBeenCalledTimes(2))
	first.resolve(granted)
	await new Promise((done) => setTimeout(done, 25))
	expect(view.state()[0]).toBe(null)
	second.resolve(denied)
	await vi.waitFor(() => expect(view.state()[0]).toEqual(denied))
	const pending = view.state()[1](),
		count = view.renders()
	view.root.unmount()
	request.resolve(granted)
	await pending
	await new Promise((done) => setTimeout(done, 25))
	expect(view.renders()).toBe(count)
})
it('accepts an explicit getter immediately after commit with automatic reads disabled', async () => {
	native.permissions.mockResolvedValue(granted)
	const view = mount()
	view.render({ get: false })
	await view.state()[2]()
	await vi.waitFor(() => expect(view.state()[0]).toEqual(granted))
})
it('keeps an immediate explicit request ahead of the passive mount read', async () => {
	native.permissions.mockImplementation(async (prompt: boolean) => (prompt ? granted : denied))
	const view = mount()
	view.render({})
	await view.state()[1]()
	await vi.waitFor(() => expect(view.state()[0]).toEqual(granted))
	await new Promise((done) => setTimeout(done, 25))
	expect(view.state()[0]).toEqual(granted)
})
