import { expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	Utils: { openUrl() {} },
	Application: { on() {}, off() {} },
}))

vi.mock('./Icon', async () => {
	const { defineUniversalComponent } = await import('octane/universal/native')
	return { Icon: defineUniversalComponent('nativescript', () => null) }
})

vi.mock('./Pressable', async () => {
	const { defineUniversalComponent } = await import('octane/universal/native')
	return { Pressable: defineUniversalComponent('nativescript', (props: any) => props.children) }
})

vi.mock('./Grid.tsrx', async () => {
	const { defineUniversalComponent } = await import('octane/universal/native')
	return { Grid: defineUniversalComponent('nativescript', (props: any) => props.children) }
})

vi.mock('./Image', () => ({ Image: () => null }))
vi.mock('./escape-props', () => ({
	applyEscapeProps() {},
	nativeAccessibilityRole: (v: any) => v,
	nativeAccessibilityState: (v: any) => v,
}))

import { OrdinaryChildren } from '../tests/children.fixture.mobile.tsrx'

it('normalizes ordinary JSX sibling boundaries', () => {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(OrdinaryChildren, {})
	expect(
		container.children[0].children.map((row) => row.children.map((child) => child.props.text)),
	).toEqual([['first'], ['second']])

	root.unmount()
})

it('updates deferred expressions, inserts and removes children', async () => {
	const { ChangingChildren } = await import('../tests/children.fixture.mobile.tsrx')
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const texts = () => container.children[0].children.map((row) => row.children[0].props.text)
	root.render(ChangingChildren, { values: ['a', 'b'], last: false })
	expect(texts()).toEqual(['first', 'a', 'b'])
	const a = container.children[0].children[1]
	const b = container.children[0].children[2]
	root.render(ChangingChildren, { values: ['b', 'a', 'c'], last: true })
	expect(texts()).toEqual(['first', 'b', 'a', 'c', 'last'])
	expect(container.children[0].children[1]).toBe(b)
	expect(container.children[0].children[2]).toBe(a)
	root.render(ChangingChildren, { values: ['c'], last: false })
	expect(texts()).toEqual(['first', 'c'])
	root.unmount()
	expect(container.children).toEqual([])
})

it('renders ordinary JSX list rows, overflow and native leaf text hosts', async () => {
	const { CollectionLeaves } = await import('../tests/children.fixture.mobile.tsrx')
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const text = (node: any): string =>
		(node.props.text ?? node.props.value ?? '') + node.children.map(text).join('')

	root.render(CollectionLeaves, { start: 1, max: 2, keyName: 'A' })
	const [list, avatars, key, wrapped, button, quote] = container.children[0].children
	expect(list.children.map(text)).toEqual(['1.First', '2.Second'])
	expect(avatars.children.map(text)).toEqual(['AA', 'BB', '+1'])
	expect(key.children).toHaveLength(1)
	expect(key.children[0].type).toBe('label')
	expect(text(key)).toBe('Ctrl A')
	expect(text(wrapped)).toBe('Wrapped')
	expect(text(button)).toBe('A')
	expect(text(quote)).toBe('Quoted A')
	root.render(CollectionLeaves, { start: 5, max: 1, keyName: 'B' })
	expect(list.children.map(text)).toEqual(['5.First', '6.Second'])
	expect(avatars.children.map(text)).toEqual(['AA', '+2'])
	expect(text(key)).toBe('Ctrl B')
	expect(text(button)).toBe('B')
	expect(text(quote)).toBe('Quoted B')
	root.unmount()
})

it('preserves context, keyed component ownership and cleanup', async () => {
	const { OwnedChildren } = await import('../tests/children.fixture.mobile.tsrx')
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const events: string[] = []
	root.render(OwnedChildren, { values: ['a', 'b'], events, context: 'one' })
	expect(events.sort()).toEqual(['mount:a', 'mount:b', 'mount:fixed'])
	const a = container.children[0].children[1].children[0]
	root.render(OwnedChildren, { values: ['b', 'a', 'c'], events, context: 'two' })
	expect(container.children[0].children[2].children[0]).toBe(a)
	expect(a.props.text).toBe('two:a')
	expect(events.filter((event) => event.startsWith('cleanup'))).toEqual([])
	root.render(OwnedChildren, { values: ['c'], events, context: 'two' })
	expect(events.filter((event) => event.startsWith('cleanup')).sort()).toEqual([
		'cleanup:a',
		'cleanup:b',
	])

	root.unmount()
	expect(events.filter((event) => event.startsWith('cleanup')).sort()).toEqual([
		'cleanup:a',
		'cleanup:b',
		'cleanup:c',
		'cleanup:fixed',
	])
})

it('normalizes ordinary children in Carousel, MetadataList and OverflowList', async () => {
	const { OtherCollections } = await import('../tests/children.fixture.mobile.tsrx')
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const walk = (node: any): any[] => [node, ...node.children.flatMap(walk)]
	root.render(OtherCollections, {})
	const nodes = container.children.flatMap(walk)
	const slides = nodes.filter((node) =>
		String(node.props.className).split(' ').includes('vx-carousel-slide'),
	)

	expect(slides.map((slide) => slide.children[0].props.text)).toEqual(['slide1', 'slide2'])
	expect(slides.map((slide) => slide.props.accessibilityLabel)).toEqual([
		'Slide 1 of 2',
		'Slide 2 of 2',
	])

	expect(nodes.filter((node) => node.type === 'label').map((node) => node.props.text)).toContain(
		'meta1',
	)

	expect(
		nodes.filter((node) => node.type === 'label').map((node) => node.props.text),
	).not.toContain('meta2')

	const overflow = nodes.find((node) => node.props.id === 'overflow')
	expect(overflow.children.map((node: any) => node.props.text)).toEqual(['tool1', 'tool2'])
	root.unmount()
})

it('does not mount excluded children and cleans up when the limit shrinks', async () => {
	const { LimitedChildren } = await import('../tests/children.fixture.mobile.tsrx')
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const events: string[] = []
	root.render(LimitedChildren, { max: 2, events })
	expect(events).toEqual(['mount:a', 'mount:b'])
	root.render(LimitedChildren, { max: 1, events })
	expect(events).toEqual(['mount:a', 'mount:b', 'cleanup:b'])
	root.render(LimitedChildren, { max: 3, events })
	expect(events).toEqual(['mount:a', 'mount:b', 'cleanup:b', 'mount:b', 'mount:c'])
	root.unmount()
	expect(events.filter((event) => event === 'cleanup:a')).toHaveLength(1)
	expect(events.filter((event) => event === 'cleanup:b')).toHaveLength(2)
	expect(events.filter((event) => event === 'cleanup:c')).toHaveLength(1)
})

it('namespaces nested collection keys and drops empty mapped values', async () => {
	const { Children, universalPlan, universalValue, universalProps } =
		await import('octane/universal/native')

	const plan = universalPlan('nativescript', { kind: 'host', type: 'label', propsSlot: 0 })
	const item = (text: string) =>
		universalValue(plan, [
			universalProps([
				['set', 'key', 'same'],
				['set', 'text', text],
			]),
		])

	const values = Children.toArray([[item('a')], [item('b')]])
	const mapped = Children.map(values, (child) => child)
	const container = createObjectContainer('nativescript')
	const { defineUniversalComponent } = await import('octane/universal/native')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(
		defineUniversalComponent('nativescript', () => mapped),
		{},
	)

	expect(container.children.map((node) => node.props.text)).toEqual(['a', 'b'])
	expect(Children.toArray([null, true, false, 0, '', 1n])).toEqual([0, '', 1n])
	expect(Children.map(values, () => null)).toEqual([])
	expect(Children.map(values, () => [null, 'x', false])).toHaveLength(2)
	root.unmount()
})

it('reactively updates child collections through the owning component state', async () => {
	const { ReactiveChildren } = await import('../tests/children.fixture.mobile.tsrx')
	const { flushUniversalSync } = await import('octane/universal/native')
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const events: string[] = []
	let update!: (names: string[]) => void
	root.render(ReactiveChildren, {
		events,
		capture: (setter: typeof update) => {
			update = setter
		},
	})

	const a = container.children[0].children[1].children[0]
	flushUniversalSync(() => update(['b', 'a', 'c']))
	expect(container.children[0].children.map((row) => row.children[0].props.text)).toEqual([
		'fixed',
		'default:b',
		'default:a',
		'default:c',
	])

	expect(container.children[0].children[2].children[0]).toBe(a)
	flushUniversalSync(() => update(['c']))
	expect(events.filter((event) => event.startsWith('cleanup')).sort()).toEqual([
		'cleanup:a',
		'cleanup:b',
	])

	root.unmount()
})
