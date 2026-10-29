/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { ActivityIndicator } from '../feedback/ActivityIndicator.macos.tsrx'

function mount(props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(ActivityIndicator, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	render(props)
	return { root, render, all }
}

it('renders the named sizes, contrast and composed class/style forms', () => {
	const env = mount({ size: 'xsm', shade: 'onMedia', id: 'save', className: ['saving', { visible: true }], style: 'margin-left:8px' })
	try {
		const ring = () => env.all().find((node) => String(node.props?.className).includes('vx-spinner--appkit'))
		expect(ring().props.className).toContain('vx-spinner--size-xsm')
		expect(ring().props.className).toContain('saving visible')
		expect(ring().props.style).toContain('margin-left:8px')
		expect(ring().props.style).toContain('#ffffff')
		expect(ring().props.accessibilityLabel).toBe('Loading')
		for (const size of ['sm', 'md', 'lg', 'xl']) {
			env.render({ size })
			expect(ring().props.className).toContain(`vx-spinner--size-${size}`)
		}
	} finally { env.root.unmount() }
})

it('gives a labeled ring one ID and one progress owner, and hides when not busy', () => {
	const env = mount({ id: 'loading', label: 'Saving settings', accessibilityLabel: 'Saving', style: 'width:240px' })
	try {
		expect(env.all().filter((node) => node.props?.id === 'loading')).toHaveLength(1)
		const owners = env.all().filter((node) => node.props?.accessibilityRole === 'progressbar')
		expect(owners).toHaveLength(1)
		expect(owners[0].props.accessibilityLabel).toBe('Saving')
		expect(owners[0].props.accessibilityState.busy).toBe(true)
		expect(owners[0].props.style).toContain('width:240px')
		expect(env.all().some((node) => node.props?.text === 'Saving settings')).toBe(true)
		env.render({ busy: false })
		expect(env.all()).toHaveLength(0)
		env.render({ label: 0 })
		expect(env.all().some((node) => node.props?.text === '0')).toBe(true)
	} finally { env.root.unmount() }
})

it('keeps supplied node labels instead of coercing them to strings', () => {
	const env = mount({ label: <label text="Wait for upload" /> })
	try {
		expect(env.all().some((node) => node.props?.text === 'Wait for upload')).toBe(true)
	} finally { env.root.unmount() }
})
