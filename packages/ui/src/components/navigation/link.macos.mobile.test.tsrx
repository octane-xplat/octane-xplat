/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Link } from './Link.macos.tsrx'
import { LinkProvider } from './LinkProvider.tsrx'
import { followHref } from './nav-href'

vi.mock('./nav-href', () => ({ followHref: vi.fn() }))

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	render(props)
	return { root, render, all, host: () => all().find((node) => node.props?.accessibilityRole === 'link') }
}

it('wraps primitive children and forwards native role, classes and style', () => {
	const order: string[] = []
	vi.mocked(followHref).mockImplementation((url) => { order.push(url) })
	function Example() { return <Link href="https://example.com" onPress={() => { order.push('press') }}
		hasUnderline isStandalone isExternalLink color="red" style={{ color: 'blue' }}>Read help</Link> }
	const env = mount(Example, {})
	try {
		const host = env.host()
		expect(String(host.props.className)).toContain('vx-link--underline')
		expect(String(host.props.className)).toContain('vx-link--standalone')
		expect(host.props.style.color).toBe('blue')
		expect(env.all().some((node) => node.type === 'label')).toBe(true)
		expect(env.all().find((node) => node.props?.text === '↗')?.props.accessible).toBe(false)
		host.props.onTap()
		expect(order).toEqual(['press', 'https://example.com'])
	} finally { env.root.unmount() }
})

it('as overrides LinkProvider and injected surfaces own navigation', () => {
	vi.mocked(followHref).mockClear()
	const provider = vi.fn((props: any) => <masonview id="provided" onTap={props.onPress}><label text={props.href} /></masonview>)
	const override = vi.fn((props: any) => <masonview id="override" onTap={props.onPress}><label text={props.href} /></masonview>)
	const press = vi.fn()
	function Example(props: any) { return <LinkProvider component={provider}><Link {...props}>Help</Link></LinkProvider> }
	const env = mount(Example, { href: 'https://example.com', onPress: press })
	try {
		expect(env.all().some((node) => node.props?.id === 'provided')).toBe(true)
		env.render({ href: ' https://example.com/help ', as: override, onPress: press })
		expect(env.all().some((node) => node.props?.id === 'override')).toBe(true)
		expect(override.mock.calls.at(-1)?.[0].href).toBe('https://example.com/help')
		env.all().find((node) => node.props?.id === 'override').props.onTap()
		expect(press).toHaveBeenCalledTimes(1)
		expect(followHref).not.toHaveBeenCalled()
		const calls = override.mock.calls.length
		env.render({ href: 'javascript:alert(1)', as: override })
		expect(override).toHaveBeenCalledTimes(calls)
		expect(env.host()).toBeDefined()
	} finally { env.root.unmount() }
})
