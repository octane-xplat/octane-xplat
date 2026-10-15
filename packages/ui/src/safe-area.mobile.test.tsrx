/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import type { SafeAreaEdge } from './props'

const keyboard = vi.hoisted(() => ({ listeners: new Set<(value: number) => void>() }))

vi.mock('@nativescript/core', () => ({
	isIOS: true,
	isAndroid: false,
	Application: { ios: {} },
}))

vi.mock('./escape-props', () => ({ applyEscapeProps() {}, nativeAccessibilityState() {}, nativeAccessibilityRole() {} }))

vi.mock('./safeAreaInsets', () => ({
	useSafeAreaInsets: () => ({ top: 24, right: 4, bottom: 34, left: 0 }),
}))

vi.mock('./keyboard-inset', () => ({
	subscribeKeyboardInset: (notify: (value: number) => void) => {
		keyboard.listeners.add(notify)
		notify(0)
		return () => keyboard.listeners.delete(notify)
	},
}))

import { SafeArea } from './SafeArea.tsrx'
import { KeyboardAvoiding } from './KeyboardAvoiding.mobile.tsrx'

function Nested(props: {
	outerEdges?: readonly SafeAreaEdge[]
	innerEdges?: readonly SafeAreaEdge[]
	ignore?: boolean
}) @{
	<SafeArea edges={props.outerEdges} ignoreSafeArea={props.ignore}>
		<SafeArea edges={props.innerEdges}>
			<label text="leaf" />
		</SafeArea>
	</SafeArea>
}

function AvoidingTree(props: { insideSafeArea?: boolean; enabled?: boolean; offset?: number }) @{
	const inner =
		<KeyboardAvoiding enabled={props.enabled} keyboardVerticalOffset={props.offset}>
			<label text="field" />
		</KeyboardAvoiding>

	return props.insideSafeArea ? <SafeArea>{inner}</SafeArea> : inner
}

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(component, props)
	return { container, root }
}

// SafeArea renders a single flexboxlayout whose style carries the padding;
// the context provider introduces no host node, so children[0] is the
// nested wrapper or leaf.
const pads = (host: any) => ({
	top: host.props.style?.paddingTop,
	right: host.props.style?.paddingRight,
	bottom: host.props.style?.paddingBottom,
	left: host.props.style?.paddingLeft,
})

describe('SafeArea edge consumption', () => {
	it('pads every edge by default and leaves nothing for a nested SafeArea', () => {
		const { container, root } = mount(Nested, {})
		const outer = container.children[0]
		expect(pads(outer)).toEqual({ top: 24, right: 4, bottom: 34, left: 0 })
		expect(pads(outer.children[0])).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
		root.unmount()
	})

	it('leaves unselected edges for descendants', () => {
		const { container, root } = mount(Nested, { outerEdges: ['top'], innerEdges: ['top', 'bottom'] })
		const outer = container.children[0]
		expect(pads(outer)).toEqual({ top: 24, right: 0, bottom: 0, left: 0 })
		expect(pads(outer.children[0])).toEqual({ top: 0, right: 0, bottom: 34, left: 0 })
		root.unmount()
	})

	it('keeps ignoreSafeArea as the deprecated no-edge alias', () => {
		const { container, root } = mount(Nested, { ignore: true })
		const outer = container.children[0]
		expect(pads(outer)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
		expect(pads(outer.children[0])).toEqual({ top: 24, right: 4, bottom: 34, left: 0 })
		root.unmount()
	})
})

describe('KeyboardAvoiding', () => {
	it('pads by the keyboard inset plus offset, minus the bottom inset SafeArea consumed', async () => {
		const { container, root } = mount(AvoidingTree, { insideSafeArea: true, offset: 8 })
		await vi.waitFor(() => expect(keyboard.listeners.size).toBe(1))
		flushUniversalSync(() => keyboard.listeners.forEach((listener) => listener(300)))
		await vi.waitFor(() => {
			const flex = container.children[0].children[0].children[0]
			expect(flex.props.style?.paddingBottom).toBe(274)
		})

		root.unmount()
		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(keyboard.listeners.size).toBe(0))
	})

	it('applies the raw inset without a consuming ancestor', async () => {
		const { container, root } = mount(AvoidingTree, { offset: 8 })
		await vi.waitFor(() => expect(keyboard.listeners.size).toBe(1))
		flushUniversalSync(() => keyboard.listeners.forEach((listener) => listener(300)))
		await vi.waitFor(() => {
			const flex = container.children[0].children[0]
			expect(flex.props.style?.paddingBottom).toBe(308)
		})

		root.unmount()
	})

	it('skips the subscription and padding while disabled', async () => {
		const { container, root } = mount(AvoidingTree, { enabled: false, offset: 8 })
		flushUniversalSync(() => {})
		await Promise.resolve()
		expect(keyboard.listeners.size).toBe(0)
		expect(container.children[0].children[0].props.style).toBeUndefined()
		root.unmount()
	})
})
