/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Pressable } from './Pressable.macos.tsrx'
import { Button } from './Button.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	render(props)
	return { root, render, all, host: () => all().find((node) => node.props?.id === 'action') }
}

it('forwards testID and accessible while retaining id, spoken metadata and the press handler', () => {
	const press = vi.fn()
	const env = mount(Pressable, { id: 'action', testID: 'draft.save', accessible: false,
		onPress: press, accessibilityLabel: 'Save changes', accessibilityHint: 'Updates your draft' })
	try {
		const host = env.host()
		expect(host.props).toMatchObject({ id: 'action', testID: 'draft.save', accessible: false,
			accessibilityLabel: 'Save changes', accessibilityHint: 'Updates your draft' })
		host.props.onTap(); expect(press).toHaveBeenCalledTimes(1)
		env.render({ id: 'action', testID: 'draft.retry', accessible: true, onPress: press })
		expect(env.host()).toBe(host)
		expect(host.props).toMatchObject({ testID: 'draft.retry', accessible: true })
		env.render({ id: 'action', onPress: press })
		expect(host.props.testID).toBeUndefined()
		expect(host.props.accessible).toBeUndefined()
	} finally { env.root.unmount() }
})

it('Button forwards identifier/accessible through Pressable across busy and disabled updates', () => {
	const env = mount(Button, { id: 'action', label: 'Save', testID: 'draft.save', accessible: false })
	try {
		const host = env.host()
		expect(host.props).toMatchObject({ testID: 'draft.save', accessible: false })
		env.render({ id: 'action', label: 'Save', testID: 'draft.save', accessible: false, isLoading: true })
		expect(env.host()).toBe(host)
		expect(host.props.testID).toBe('draft.save')
		expect(host.props.accessible).toBe(false)
		env.render({ id: 'action', label: 'Save', isDisabled: true })
		expect(host.props.testID).toBeUndefined()
		expect(host.props.accessible).toBeUndefined()
	} finally { env.root.unmount() }
})
