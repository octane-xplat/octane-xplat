import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import type { TiptapJSON } from './types'

// Controlled fake for the lazy JSON bridge — the real module's dynamic
// imports aren't needed to test facade timing. `resolved`/`ready` model the
// bridge settling; docs carry `html` so conversions stay deterministic.
const bridge = vi.hoisted(() => ({
	ready: false,
	resolved: undefined as boolean | undefined,
	waiters: [] as Array<(ok: boolean) => void>,
}))

vi.mock('./json-bridge', () => ({
	ensureJSONBridge: () =>
		bridge.resolved !== undefined
			? Promise.resolve(bridge.resolved)
			: new Promise<boolean>((resolve) => bridge.waiters.push(resolve)),
	jsonBridgeReady: () => bridge.ready,
	jsonToHTML: (doc: any) =>
		doc && typeof doc === 'object' && typeof doc.html === 'string' ? doc.html : null,
	htmlToJSON: (html: string) => ({ type: 'doc', html }),
}))

vi.mock('@octane-xplat/richtext', async () => {
	return await import('../tests/fake-richtext.fixture.mobile.tsrx')
})

import { TiptapEditor } from './TiptapEditor.tsrx'
import { hosts, resetFakeRichtext, setDefer } from '../tests/fake-richtext.fixture.mobile.tsrx'

const docA = { type: 'doc', html: '<p>alpha</p>' } as unknown as TiptapJSON
const docB = { type: 'doc', html: '<p>bravo</p>' } as unknown as TiptapJSON

const roots: ReturnType<typeof createUniversalRoot>[] = []

function mount(props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	roots.push(root)
	let handle: any = null
	root.render(TiptapEditor, {
		...props,
		ref: (next: any) => {
			handle = next
		},
	})

	return {
		root,
		container,
		get handle() {
			return handle
		},
	}
}

function settleBridge(ok: boolean) {
	bridge.ready = ok
	bridge.resolved = ok
	for (const resolve of bridge.waiters.splice(0)) {
		resolve(ok)
	}
}

async function settle() {
	for (let i = 0; i < 12; i++) {
		await Promise.resolve()
	}

	flushUniversalSync(() => {})
}

beforeEach(() => {
	bridge.ready = false
	bridge.resolved = undefined
	bridge.waiters.length = 0
	resetFakeRichtext()
})

afterEach(() => {
	for (const root of roots.splice(0)) {
		root.unmount()
	}
})

describe('TiptapEditor native JSON readiness', () => {
	it('applies an initial props.json once when the bridge settles after mount', async () => {
		const onJSONReady = vi.fn()
		mount({ json: docA, onJSONReady })
		await settle()
		expect(hosts[0].setCalls).toEqual([])

		settleBridge(true)
		await settle()
		expect(onJSONReady).toHaveBeenCalledWith(true)
		expect(hosts[0].html).toBe('<p>alpha</p>')
		expect(hosts[0].setCalls).toEqual(['<p>alpha</p>'])
	})

	it('applies an initial props.json when the host readies after the bridge', async () => {
		bridge.ready = true
		bridge.resolved = true
		setDefer(true)
		mount({ json: docA })
		await settle()
		expect(hosts[0].setCalls).toEqual([])

		hosts[0].ready()
		await settle()
		expect(hosts[0].html).toBe('<p>alpha</p>')
		expect(hosts[0].setCalls).toEqual(['<p>alpha</p>'])
	})

	it('applies an initial props.json once when host and bridge are both late', async () => {
		setDefer(true)
		mount({ json: docA })
		await settle()
		hosts[0].ready()
		await settle()
		expect(hosts[0].setCalls).toEqual([])

		settleBridge(true)
		await settle()
		expect(hosts[0].setCalls).toEqual(['<p>alpha</p>'])
	})

	it('keeps json precedence over value once readiness lands', async () => {
		mount({ value: '<p>value</p>', json: docA })
		await settle()
		settleBridge(true)
		await settle()
		expect(hosts[0].html).toBe('<p>alpha</p>')
	})

	it('applies later props.json updates and skips identical docs', async () => {
		const view = mount({ json: docA })
		settleBridge(true)
		await settle()
		expect(hosts[0].setCalls).toEqual(['<p>alpha</p>'])

		view.root.render(TiptapEditor, { json: docB } as any)
		await settle()
		expect(hosts[0].setCalls).toEqual(['<p>alpha</p>', '<p>bravo</p>'])

		view.root.render(TiptapEditor, { json: docB } as any)
		await settle()
		expect(hosts[0].setCalls).toEqual(['<p>alpha</p>', '<p>bravo</p>'])
	})

	it('does not push a doc the editor itself emitted back at it', async () => {
		const onJSONChange = vi.fn()
		const view = mount({ onJSONChange })
		settleBridge(true)
		await settle()

		const rig = hosts[0]
		rig.html = '<p>typed</p>'
		// The leaf calls props.onChange(html); the facade wraps it to emit JSON.
		rig.props.onChange('<p>typed</p>')
		await settle()
		const emitted = onJSONChange.mock.calls[0][0]
		expect(emitted).toEqual({ type: 'doc', html: '<p>typed</p>' })

		view.root.render(TiptapEditor, { json: emitted, onJSONChange } as any)
		await settle()
		expect(rig.setCalls).toEqual([])
	})

	it('defers an imperative setJSON issued before the bridge settles', async () => {
		const view = mount({})
		await settle()
		expect(view.handle).not.toBeNull()

		view.handle.setJSON(docB)
		expect(hosts[0].setCalls).toEqual([])
		settleBridge(true)
		await settle()
		expect(hosts[0].setCalls).toEqual(['<p>bravo</p>'])
	})

	it('re-applies the current doc when the host rebinds', async () => {
		mount({ json: docA })
		settleBridge(true)
		await settle()
		expect(hosts[0].setCalls).toEqual(['<p>alpha</p>'])

		hosts[0].rebind()
		await settle()
		expect(hosts[0].html).toBe('<p>alpha</p>')
		expect(hosts[0].setCalls).toEqual(['<p>alpha</p>'])
	})

	it('ignores a bridge that settles after unmount', async () => {
		const onJSONReady = vi.fn()
		const view = mount({ json: docA, onJSONReady })
		await settle()
		view.root.unmount()

		settleBridge(true)
		await settle()
		expect(onJSONReady).not.toHaveBeenCalled()
		expect(hosts[0].setCalls).toEqual([])
	})

	it('reports bridge failure through onJSONReady without touching the host', async () => {
		const onJSONReady = vi.fn()
		const view = mount({ json: docA, onJSONReady })
		await settle()
		settleBridge(false)
		await settle()
		expect(onJSONReady).toHaveBeenCalledWith(false)
		expect(hosts[0].setCalls).toEqual([])
		expect(view.handle.getJSON()).toBeNull()
	})

	it('drops a doc the converter rejects instead of writing null HTML', async () => {
		mount({ json: { type: 'doc', content: [{ type: 'mystery' }] } as any })
		settleBridge(true)
		await settle()
		expect(hosts[0].setCalls).toEqual([])
	})
})
