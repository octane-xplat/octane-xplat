/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Text, RichText, RichTextSpan } from '../content/Text.macos.tsrx'
import { RichText as PurposeRichText, RichTextSpan as PurposeRichTextSpan } from '../content/RichText.macos.tsrx'
import { Heading } from '../content/Heading.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	render(props)
	return { root, render, all }
}

it('AppKit rich purpose entry shares the root leaf and explicit span text wins without duplication', () => {
	expect(PurposeRichText).toBe(RichText); expect(PurposeRichTextSpan).toBe(RichTextSpan)
	function Parent(props: any) { return <PurposeRichText><PurposeRichTextSpan text={props.text}><PurposeRichTextSpan text="fallback" /></PurposeRichTextSpan></PurposeRichText> }
	const env = mount(Parent, { text: 'Read ' })
	try {
		const span = env.all().find((node) => node.type === 'span')
		expect(span.props.text).toBe('Read '); expect(span.children).toHaveLength(0)
		env.render({ text: '' }); expect(span.props.text).toBe(''); expect(span.children).toHaveLength(0)
		env.render({}); expect(span.props.text).toBeUndefined(); expect(span.children[0].props.text).toBe('fallback')
	} finally { env.root.unmount() }
})

it('nested AppKit Text and RichText create logical runs under one native text owner', () => {
	function Parent(props: any) { return <Text id="owner">Read <Text className="strong" style={{ fontWeight: props.weight }}>this</Text><RichText><RichTextSpan text=" now" /></RichText></Text> }
	const env = mount(Parent, { weight: 600 })
	try {
		expect(env.all().filter((node) => node.type === 'label')).toHaveLength(1)
		const owner = env.all().find((node) => node.props?.id === 'owner'), strong = env.all().find((node) => node.props?.className === 'strong')
		expect(strong.type).toBe('span'); expect(strong.props.style.fontWeight).toBe(600); expect(env.all().filter((node) => node.type === 'span')).toHaveLength(3)
		env.render({ weight: 700 }); expect(env.all().find((node) => node.props?.id === 'owner')).toBe(owner); expect(strong.props.style.fontWeight).toBe(700)
	} finally { env.root.unmount() }
})

it('AppKit Heading provides a text scope without leaking it to a sibling Text', () => {
	function Parent() { return <><Heading id="title"><Text>Heading run</Text></Heading><Text id="sibling">Body</Text></> }
	const env = mount(Parent, {})
	try {
		expect(env.all().filter((node) => node.type === 'label')).toHaveLength(2)
		expect(env.all().find((node) => node.props?.id === 'sibling').type).toBe('label')
		expect(env.all().find((node) => node.props?.id === 'title').children[0].type).toBe('span')
	} finally { env.root.unmount() }
})

it('AppKit top-level Text and RichText preserve declared parent layout and outer line caps', () => {
	for (const component of [Text, RichText]) {
		const env = mount(component, { row: 1, col: 2, colSpan: 2, flexGrow: 1, maxLines: 1, style: { color: '#123456' }, children: 'Content' })
		try {
			const host = env.all().find((node) => node.type === 'label')
			expect(host.props.style).toMatchObject({ gridRow: '2 / span 1', gridColumn: '3 / span 2', flexGrow: 1, color: '#123456' })
			if (component === Text) { expect(host.props.style.flexShrink).toBe(1); expect(host.props.maxLines).toBe(1) }
			env.render({ children: 'Content' }); expect(host.props.style.gridRow).toBeUndefined(); expect(host.props.style.gridColumn).toBeUndefined()
		} finally { env.root.unmount() }
	}
})

it('AppKit outer Text forwards declared identity/description/visibility metadata and releases removed overrides', () => {
	const env = mount(Text, { id: 'count', testID: 'count-test', accessible: false, accessibilityLabel: 'Items', accessibilityHint: 'Open the collection.', accessibilityValue: '12 items', children: '12' })
	try {
		const host = env.all().find((node) => node.type === 'label')
		expect(host.props.testID).toBe('count-test'); expect(host.props.accessible).toBe(false); expect(host.props.accessibilityLabel).toBe('Items'); expect(host.props.accessibilityHint).toBe('Open the collection.'); expect(host.props.accessibilityValue).toBe('12 items')
		env.render({ id: 'count', children: '13' }); expect(env.all().find((node) => node.type === 'label')).toBe(host)
		for (const name of ['testID', 'accessible', 'accessibilityLabel', 'accessibilityHint', 'accessibilityValue']) expect(host.props[name]).toBeUndefined()
	} finally { env.root.unmount() }
})
