/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Toolbar } from './Toolbar.macos.tsrx'
import { Button } from './Button.macos.tsrx'

it('Toolbar keeps a named toolbar host and its actions while label, orientation and slots change', () => {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (props: any) => { root.render(Toolbar, props); flushUniversalSync(() => {}) }
	const nodes = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const actions: string[] = [], start = <Button id="save" label="Save" clickAction={() => { actions.push('save') }} />
	try {
		render({ id: 'actions', label: 'Page actions', startContent: start, centerContent: <label text="Draft" /> })
		const host = nodes().find((node) => node.props?.id === 'actions')
		expect(host.props.accessibilityRole).toBe('toolbar'); expect(host.props.accessibilityLabel).toBe('Page actions')
		expect(host.props.onTap).toBeUndefined()
		nodes().find((node) => node.props?.id === 'save').props.onTap(); expect(actions).toEqual(['save'])
		render({ id: 'actions', label: 'Document actions', orientation: 'vertical', startContent: start, endContent: <label text="Ready" /> })
		expect(nodes().find((node) => node.props?.id === 'actions')).toBe(host)
		expect(host.props.accessibilityRole).toBe('toolbar'); expect(host.props.accessibilityLabel).toBe('Document actions')
		expect(nodes().some((node) => node.props?.text === 'Ready')).toBe(true)
	} finally { root.unmount() }
})
