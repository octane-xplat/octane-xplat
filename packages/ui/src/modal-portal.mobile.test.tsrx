/** @jsxImportSource @nativescript-community/octane */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

const state = vi.hoisted(() => {
	const hosts: any[] = []
	const roots: any[] = []
	const portals: any[] = []
	const themes: any[] = []
	const presentations = new Map<any, any>()
	class GridLayout {
		className = ''
		removeChildren = vi.fn()
		closeModal = vi.fn(() => presentations.get(this)?.closeCallback?.())
		constructor() {
			hosts.push(this)
		}
	}

	const presenter = {
		showModal: vi.fn((host: any, options: any) => presentations.set(host, options)),
	}

	return { hosts, roots, portals, themes, presentations, GridLayout, presenter }
})

vi.mock('@nativescript/core', () => ({
	Frame: { topmost: () => ({}) },
	GridLayout: state.GridLayout,
}))

vi.mock('@nativescript-community/octane', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	createNativeScriptRoot: (host: any) => {
		const root = { host, render: vi.fn(), unmount: vi.fn() }
		state.roots.push(root)
		return root
	},
}))

vi.mock('./native-portal', () => ({
	createPortal: (children: any, target: any) => {
		state.portals.push({ children, target })
		return children
	},
}))

vi.mock('./modal-presenter', () => ({ modalPresenter: () => state.presenter }))
vi.mock('./theme/theme-host', () => ({
	applyThemeClasses: (host: any) => {
		const cleanup = vi.fn()
		state.themes.push({ host, cleanup })
		return cleanup
	},
}))

import { UIModal } from './ios/UIModal.ios.tsrx'
import { MaterialDialog } from './android/MaterialDialog.android.tsrx'

const mounted: any[] = []
let observedComponentProps: Record<string, unknown> | null = null
const settle = async () => {
	flushUniversalSync(() => {})
	await new Promise((resolve) => setTimeout(resolve, 0))
	flushUniversalSync(() => {})
}

function ModalComponent(props: { value: string }) @{
	observedComponentProps = props

	<></>
}

function mount(Component: any, props: any) {
	const root = createUniversalRoot(
		createObjectContainer('nativescript'),
		createObjectDriver('nativescript'),
	)

	mounted.push(root)
	const render = (next: any = {}) => {
		root.render(Component, { open: true, children: 'content', ...props, ...next })
		flushUniversalSync(() => {})
	}

	render()
	return { root, render }
}

beforeEach(() => {
	state.hosts.length = 0
	state.roots.length = 0
	state.portals.length = 0
	state.themes.length = 0
	state.presentations.clear()
	state.presenter.showModal.mockClear()
	observedComponentProps = null
})

afterEach(async () => {
	for (const root of mounted.splice(0)) {
		root.unmount()
	}

	await settle()
})

describe.each([
	['UIModal', UIModal],
	['MaterialDialog', MaterialDialog],
] as const)('%s native context', (_, Component) => {
	it('portals children from the declaring root and closes the native host', async () => {
		const onClose = vi.fn()
		const { root, render } = mount(Component, { onClose })
		await settle()

		const host = state.hosts[0]
		expect(state.presenter.showModal).toHaveBeenCalledTimes(1)
		expect(state.presenter.showModal).toHaveBeenCalledWith(
			host,
			expect.objectContaining({ closeCallback: expect.any(Function) }),
		)

		expect(state.portals.at(-1)?.target).toBe(host)
		expect(state.roots).toHaveLength(0)

		host.closeModal.mockImplementation(() => {})
		render({ open: false })
		await settle()
		expect(host.closeModal).toHaveBeenCalledTimes(1)
		expect(host.removeChildren).not.toHaveBeenCalled()
		expect(onClose).not.toHaveBeenCalled()
		expect(state.portals.at(-1)?.target).toBe(host)
		state.presentations.get(host).closeCallback()
		await settle()
		expect(host.removeChildren).toHaveBeenCalledTimes(1)
		expect(state.themes[0].cleanup).toHaveBeenCalledTimes(1)
		expect(onClose).toHaveBeenCalledTimes(1)
		expect(state.roots).toHaveLength(0)
		root.unmount()
	})

	it('portals component content with its explicit params', async () => {
		const { root } = mount(Component, { component: ModalComponent, params: { value: 'provided' } })
		await settle()

		expect(state.roots).toHaveLength(0)
		expect(state.portals.at(-1)?.target).toBe(state.hosts[0])
		expect(observedComponentProps).toEqual({ value: 'provided' })
		root.unmount()
	})
})
