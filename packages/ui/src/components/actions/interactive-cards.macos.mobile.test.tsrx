/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { openUrl } from '@octane-xplat/platform'
import { ClickableCard } from './ClickableCard.macos.tsrx'
import { SelectableCard } from './SelectableCard.macos.tsrx'
import { Button } from './Button.macos.tsrx'

vi.mock('@octane-xplat/platform', async (original) => ({ ...await original<typeof import('@octane-xplat/platform')>(), openUrl: vi.fn() }))
function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	render(props)
	return { root, render, all, host: () => all().find((node) => node.props?.id === 'card') }
}

it('clickable cards open sanitized href before callbacks, expose link role and block disabled activation', () => {
	vi.mocked(openUrl).mockClear()
	const order: string[] = []
	vi.mocked(openUrl).mockImplementation((url) => { order.push(url); return true })
	const press = () => { order.push('press') }
	const env = mount(ClickableCard, { id: 'card', label: 'Open project', href: ' https://example.com/\nproject ', onPress: press })
	try {
		const host = env.host()
		expect(host.props.accessibilityRole).toBe('link')
		expect(host.props.accessibilityLabel).toBe('Open project')
		host.props.onTap()
		expect(order).toEqual(['https://example.com/project', 'press'])
		env.render({ id: 'card', label: 'Open project', href: 'javascript:bad', onPress: press })
		expect(env.host()).toBe(host)
		host.props.onTap()
		expect(order).toEqual(['https://example.com/project', 'press', 'press'])
		env.render({ id: 'card', label: 'Open project', href: 'https://example.com', isDisabled: true, onPress: press })
		expect(host.props.onTap).toBeUndefined()
		expect(host.props.accessibilityState.disabled).toBe(true)
		expect(openUrl).toHaveBeenCalledTimes(1)
		env.render({ id: 'card', label: 'Open project', onPress: press })
		expect(host.props.accessibilityRole).toBe('button')
	} finally { env.root.unmount() }
})

it('card primitive text and supplied nested controls keep native hosts and presentation classes', () => {
	function Fixture(props: any) { return <ClickableCard {...props}>Open collection<Button id="nested-action" label="More" /></ClickableCard> }
	const env = mount(Fixture, { id: 'card', label: 'Open collection', elevation: 'med', variant: 'outlined', padding: 3, width: 280 })
	try {
		const host = env.host()
		expect(String(host.props.className)).toContain('vx-card--outlined')
		expect(String(host.props.className)).toContain('vx-card--elev-med')
		expect(host.props.style).toMatchObject({ padding: 12, width: 280 })
		expect(env.all().some((node) => node.type === 'label')).toBe(true)
		expect(env.all().some((node) => node.props?.id === 'nested-action')).toBe(true)
	} finally { env.root.unmount() }
})

it('selectable cards request controlled changes, retain checked hosts and forward variant/elevation', () => {
	const change = vi.fn()
	function Fixture(props: any) { return <SelectableCard {...props}>Choose plan</SelectableCard> }
	const env = mount(Fixture, { id: 'card', label: 'Basic plan', isSelected: false, onChange: change, variant: 'outlined', elevation: 'low' })
	try {
		const host = env.host()
		expect(host.props.accessibilityRole).toBe('checkbox')
		expect(String(host.props.className)).toContain('vx-card--outlined')
		expect(String(host.props.className)).toContain('vx-card--elev-low')
		host.props.onTap(); expect(change).toHaveBeenLastCalledWith(true)
		expect(host.props.accessibilityState.checked).toBe(false)
		env.render({ id: 'card', label: 'Basic plan', isSelected: true, onChange: change })
		expect(env.host()).toBe(host)
		expect(host.props.accessibilityState).toMatchObject({ checked: true, selected: true })
		host.props.onTap(); expect(change).toHaveBeenLastCalledWith(false)
		env.render({ id: 'card', label: 'Basic plan', isSelected: true, onChange: change, isDisabled: true })
		expect(host.props.onTap).toBeUndefined()
	} finally { env.root.unmount() }
})


it('SelectableCard owns disabled-focus claims and releases them on enablement/removal', () => {
	const previous = (globalThis as any).__xplatAppKit
	const active = new Map<object, number>(), released: object[] = []
	;(globalThis as any).__xplatAppKit = { ...previous, retainDisabledFocus(view: object) {
		active.set(view, (active.get(view) ?? 0) + 1)
		let live = true
		return () => {
			if (!live) return
			live = false
			released.push(view)
			const count = (active.get(view) ?? 1) - 1
			if (count) active.set(view, count); else active.delete(view)
		}
	} }
	const change = vi.fn()
	const env = mount(SelectableCard, { id: 'card', label: 'Plan', isSelected: true, isDisabled: true, onChange: change })
	try {
		const host = env.host()
		expect(active.get(host)).toBe(1)
		expect(host.props.onTap).toBeUndefined()
		expect(host.props.accessibilityState.disabled).toBe(true)
		env.render({ id: 'card', label: 'Plan', isSelected: true, isDisabled: true, onChange: change })
		expect(active.get(host)).toBe(1)
		env.render({ id: 'card', label: 'Plan', isSelected: true, onChange: change })
		expect(env.host()).toBe(host)
		expect(active.size).toBe(0)
		expect(released).toHaveLength(1)
		env.render({ id: 'card', label: 'Plan', isSelected: true, isDisabled: true, onChange: change })
		expect(active.get(host)).toBe(1)
	} finally {
		env.root.unmount()
		expect(active.size).toBe(0)
		;(globalThis as any).__xplatAppKit = previous
	}
})
