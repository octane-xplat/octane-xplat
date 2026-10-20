// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
import { Tabs } from './Tabs.web.tsrx'
import { defaultRouterRuntime } from './default-router.web'
import type { TabSpec } from './props'

const roots: ReturnType<typeof createRoot>[] = []
function mount(Component: any, props: any) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push(root)
	act(() => root.render(Component, props))
	return root
}

const TABS: TabSpec[] = [
	{ key: 'alpha', title: 'Alpha', render: () => <span>pane-alpha</span> },
	{ key: 'beta', title: 'Beta', render: () => <span>pane-beta</span> },
]

afterEach(() => { act(() => roots.splice(0).forEach((r) => r.unmount())); document.body.replaceChildren() })

describe('Tabs selection keys (web)', () => {
	it('renders UI-only tabs without constructing a router', () => {
		const getClient = vi.spyOn(defaultRouterRuntime, 'getClient')
		try {
			mount(Tabs, { tabs: TABS })
			expect(document.querySelectorAll('[role="tabpanel"]')).toHaveLength(2)
			expect(getClient).not.toHaveBeenCalled()
		} finally { getClient.mockRestore() }
	})

	it('selects the pane by stable key and wires the tab↔panel ARIA pair', () => {
		mount(Tabs, { tabs: TABS, selectedKey: 'beta' })
		expect(document.querySelector('[role="tabpanel"]:not([hidden])')?.textContent).toContain('pane-beta')
		const panel = document.querySelector('[role="tabpanel"]:not([hidden])') as HTMLElement
		const tab = document.querySelector('[data-tab-value="beta"]') as HTMLElement
		expect(panel.getAttribute('aria-labelledby')).toBe(tab.id)
		expect(tab.getAttribute('aria-controls')).toBe(panel.id)
		expect(tab.getAttribute('aria-selected')).toBe('true')
	})

	it('reports the selected key and the legacy index together', () => {
		const change = vi.fn(), byIndex = vi.fn()
		mount(Tabs, { tabs: TABS, selectedKey: 'beta', onSelectionChange: change, onSelectedIndexChanged: byIndex })
		act(() => (document.querySelector('[data-tab-value="alpha"]') as HTMLElement).click())
		expect(change).toHaveBeenCalledWith('alpha')
		expect(byIndex).toHaveBeenCalledWith(0)
		// Controlled: without a new selectedKey the pane stays on beta.
		expect(document.querySelector('[role="tabpanel"]:not([hidden])')?.textContent).toContain('pane-beta')
	})

	it('defaults to the first tab and follows defaultSelectedKey uncontrolled', () => {
		const change = vi.fn()
		mount(Tabs, { tabs: TABS, defaultSelectedKey: 'beta', onSelectionChange: change })
		expect(document.querySelector('[role="tabpanel"]:not([hidden])')?.textContent).toContain('pane-beta')
		act(() => (document.querySelector('[data-tab-value="alpha"]') as HTMLElement).click())
		expect(change).toHaveBeenCalledWith('alpha')
		expect(document.querySelector('[role="tabpanel"]:not([hidden])')?.textContent).toContain('pane-alpha')
	})

	it('keeps index selection working through the deprecated props', () => {
		const byIndex = vi.fn()
		mount(Tabs, { tabs: [{ title: 'A', render: () => <span>pane-a</span> }, { title: 'B', render: () => <span>pane-b</span> }], selectedIndex: 1, onSelectedIndexChanged: byIndex })
		expect(document.querySelector('[role="tabpanel"]:not([hidden])')?.textContent).toContain('pane-b')
		act(() => (document.querySelector('[data-tab-value="0"]') as HTMLElement).click())
		expect(byIndex).toHaveBeenCalledWith(0)
	})
})
