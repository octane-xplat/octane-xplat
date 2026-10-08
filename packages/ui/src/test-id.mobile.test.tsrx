/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'
vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))
vi.mock('./Icon', () => ({ Icon: () => null }))
import { Pressable } from './Pressable'
import { View } from './View'
import { Stack } from './Stack'
import { TextInput } from './TextInput'
import { SearchInput } from './SearchInput'

function ActionWithChild(props: any) {
	return <Pressable {...props}><Pressable testID="child.action" /></Pressable>
}

function ContainerWithChild(props: any) {
	const Component = props.Component
	return <Component testID="parent"><Pressable testID="child" /></Component>
}

function nodes(children: any[]): any[] {
	return children.flatMap((node) => [node, ...nodes(node.children ?? [])])
}

describe('automation identity binding (renderer evidence, not OS qualification)', () => {
	it('updates and clears a retained host without changing id, labels, roles, or child identity', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const props = { id: 'legacy', accessibilityLabel: 'Open item', accessibilityRole: 'button' }
		root.render(ActionWithChild as any, { ...props, testID: 'item.a.open' })
		const host = container.children[0]
		expect(host.props.testID).toBe('item.a.open')
		expect(host.children[0].props.testID).toBe('child.action')
		root.render(ActionWithChild as any, { ...props, testID: 'item.b.open' })
		expect(container.children[0]).toBe(host)
		expect(host.props.testID).toBe('item.b.open')
		root.render(ActionWithChild as any, props)
		expect(host.props.testID).toBe('')
		expect(host.props.id).toBe('legacy')
		expect(host.props.accessibilityLabel).toBe('Open item')
		expect(host.props.accessibilityRole).toBe('button')
		expect(host.children[0].props.testID).toBe('child.action')
		root.unmount()
	})

	it.each([View, Stack])('assigns container identity only to its host', (Component) => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(ContainerWithChild as any, { Component })
		expect(nodes(container.children).map((node) => node.props.testID).filter(Boolean)).toEqual(['parent', 'child'])
		root.unmount()
	})

	it.each([TextInput, SearchInput])('targets the editable field rather than the input shell', (Component) => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(Component as any, { testID: 'entry', icon: false, hasClear: false })
		const identified = nodes(container.children).filter((node) => node.props.testID)
		expect(identified).toHaveLength(1)
		expect(identified[0].type).toBe('textfield')
		root.unmount()
	})
})
