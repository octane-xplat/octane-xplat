import { describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
	hosts: [] as any[],
	roots: [] as any[],
	owner: null as any,
}))

vi.mock('@nativescript/core', () => ({
	Application: {
		primaryWindow: undefined,
		on: () => {},
		off: () => {},
	},
	GridLayout: class {
		className = ''
		horizontalAlignment = ''
		verticalAlignment = ''
		style: Record<string, unknown> = {}
		on() {}
		off() {}
		constructor() {
			state.hosts.push(this)
		}
	},
	isIOS: false,
	isAndroid: true,
	Screen: { mainScreen: { scale: 1 } },
}))

vi.mock('@nativescript-community/octane', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	createNativeScriptRoot: () => {
		const root = { render: vi.fn(), unmount: vi.fn() }
		state.roots.push(root)
		return root
	},
}))

vi.mock('./root-layout.mobile', () => ({ rootLayoutFor: () => state.owner }))
vi.mock('./theme/theme-scheme', () => ({
	useThemeScheme: () => 'light',
	applyThemeClasses: (host: any, base: string) => {
		host.className = base
		return () => {}
	},
}))

import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { useLayer } from './use-layer.mobile.tsrx'

let layer: any = null

function Probe(props: { fixed?: boolean }) {
	layer = useLayer({ mode: props.fixed ? 'fixed' : 'context' })
	return (
		<stacklayout>
			{layer.render(
				<gridlayout />,
				props.fixed ? { x: 10, y: 20 } : { placement: 'below' },
			)}
		</stacklayout>
	)
}

function freshOwner() {
	state.hosts.length = 0
	state.roots.length = 0
	state.owner = {
		open: vi.fn(async () => {}),
		close: vi.fn(async () => {}),
		hasChild: () => true,
		getPopupIndex: () => 0,
	}
}

describe('useLayer (mobile)', () => {
	it('fixed mode mounts a positioned layer host on the RootLayout', async () => {
		freshOwner()
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(Probe as any, { fixed: true })
		flushUniversalSync(() => {})

		expect(layer.ref).toBeUndefined()
		expect(layer.isOpen).toBe(false)

		layer.show()
		await vi.waitFor(() => expect(layer.isOpen).toBe(true))
		await vi.waitFor(() => expect(state.owner.open).toHaveBeenCalled())

		const host = state.hosts.at(-1)
		expect(host.className).toContain('vx-layer-host')
		const surfaceProps = state.roots.at(-1).render.mock.calls.at(-1)[1]
		expect(surfaceProps.x).toBe(10)
		expect(surfaceProps.y).toBe(20)

		layer.hide()
		await vi.waitFor(() => expect(state.owner.close).toHaveBeenCalled())
		await vi.waitFor(() => expect(layer.isOpen).toBe(false))
		root.unmount()
	})

	it('context mode presents through Popover once the anchor binds', async () => {
		freshOwner()
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(Probe as any, { fixed: false })
		flushUniversalSync(() => {})

		expect(typeof layer.ref).toBe('function')
		layer.ref({})
		layer.show()
		await vi.waitFor(() => expect(layer.isOpen).toBe(true))
		await vi.waitFor(() => expect(state.owner.open).toHaveBeenCalled())

		const host = state.hosts.at(-1)
		expect(host.className).toContain('vx-popover-host')

		layer.hide()
		await vi.waitFor(() => expect(layer.isOpen).toBe(false))
		root.unmount()
	})
})
