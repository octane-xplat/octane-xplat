/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Text, RichText, RichTextSpan } from './Text.macos.tsrx'
import { Heading } from './Heading.macos.tsrx'
import { Heading as BarrelHeading } from './macos-extras.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	render(props)
	return { root, render, host: () => container.children[0] }
}

it('AppKit Text and Heading retain CSS strings over type-scale defaults', () => {
	for (const component of [Text, Heading]) {
		const env = mount(component, { type: component === Text ? 'body' : 'display-1', style: 'font-size:31px;color:#123456', children: 'Title' })
		try {
			expect(env.host().props.style).toContain('font-size:31px;color:#123456')
		} finally { env.root.unmount() }
	}
})

it('AppKit Text and Heading fold array overrides and remove them without replacing the host', () => {
	for (const component of [Text, Heading]) {
		const env = mount(component, { children: 'Title' })
		try {
			const host = env.host(), baseline = { ...host.props.style }
			env.render({ style: [{ fontSize: 20, color: '#112233' }, null, { fontSize: 30 }], children: 'Title' })
			expect(host.props.style).toMatchObject({ fontSize: 30, color: '#112233' })
			env.render({ children: 'Title' }); expect(env.host()).toBe(host); expect(host.props.style).toEqual(baseline)
		} finally { env.root.unmount() }
	}
})

it('AppKit Heading uses one exported leaf and preserves level/classes/truncation with authored styles', () => {
	expect(BarrelHeading).toBe(Heading)
	const env = mount(BarrelHeading, { id: 'title', level: 3, maxLines: 1, className: ['title', { compact: true }], style: 'width:180px', children: 'Title' })
	try {
		const host = env.host()
		expect(host.props.id).toBe('title'); expect(host.props.className).toContain('vx-h3'); expect(host.props.className).toContain('title compact'); expect(host.props.accessibilityRole).toBe('heading')
		expect(host.props.maxLines).toBe(1); expect(host.props.whiteSpace).toBe('nowrap'); expect(host.props.textOverflow).toBe('ellipsis')
		env.render({ level: 2, children: 'Title' }); expect(env.host()).toBe(host); expect(host.props.className).toContain('vx-h2'); expect(host.props.maxLines).toBeUndefined(); expect(host.props.whiteSpace).toBeUndefined(); expect(host.props.textOverflow).toBeUndefined()
	} finally { env.root.unmount() }
})

it('AppKit rich hosts and spans preserve authored declarations for renderer normalization', () => {
	const env = mount(RichText, { id: 'rich', style: 'font-size:20px;color:#112233', children: <RichTextSpan className="warning" style="letter-spacing:2px;font-weight:600">Warning</RichTextSpan> })
	try {
		const host = env.host(), span = host.children.find((node: any) => node.type === 'span')
		expect(host.props.id).toBe('rich'); expect(host.props.style).toBe('font-size:20px;color:#112233'); expect(span.props.style).toBe('letter-spacing:2px;font-weight:600'); expect(span.props.className).toBe('warning')
		env.render({ children: <RichTextSpan>Warning</RichTextSpan> }); expect(env.host()).toBe(host); expect(host.props.style).toBeUndefined(); expect(span.props.style).toBeUndefined()
	} finally { env.root.unmount() }
})
