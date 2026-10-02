import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('@nativescript/core', async () => (await import('./core-mock')).createCoreMock())
vi.mock('@nativescript/core/ui/core/properties', async () => {
	const mock = await import('./core-mock')
	return { _getStyleProperties: () => mock.styleProperties }
})
import {
	MockFormattedString,
	MockLayoutBase,
	MockSpan,
	MockTextBase,
	unsetValue,
} from './core-mock'
import {
	create,
	destroy,
	insert,
	listener,
	event,
	mount,
	releaseMounted,
	remove,
	update,
} from './mount'
import { registerElement } from '@rich-text/elements'
afterEach(releaseMounted)
const move = (id: number, parent: number, before: number | null = null) => ({
	op: 'move' as const,
	id,
	parent,
	before,
})
const runs = (view: MockTextBase | MockFormattedString) => [
	...(view instanceof MockTextBase ? view.formattedText!.spans : view.spans),
]
const text = (view: MockTextBase) =>
	view.formattedText
		? runs(view)
				.map((s) => s.text)
				.join('')
		: view.text
function mixed() {
	const m = mount(new MockLayoutBase())
	m.apply(
		create(1, 'label'),
		create(2, '#text', { value: 'a' }),
		create(3, 'span', { style: { fontWeight: 'bold', color: 'red' } }),
		create(4, '#text', { value: 'b' }),
		create(5, '#text', { value: 'c' }),
		insert(1),
		insert(2, 1),
		insert(3, 1),
		insert(4, 3),
		insert(5, 1),
	)
	return { ...m, label: m.view<MockTextBase>(1) }
}
describe('rich text ownership', () => {
	it('orders mixed leaves and updates text and properties without replacing runs', () => {
		const { apply, view, label } = mixed()
		const initial = runs(label)
		expect(text(label)).toBe('abc')
		expect(initial.map((s) => s.style.fontWeight)).toEqual([undefined, 'bold', undefined])
		apply(update(4, { value: 'B' }), update(3, { style: { fontWeight: 'normal', color: 'blue' } }))
		expect(text(label)).toBe('aBc')
		expect(runs(label)).toEqual(initial)
		expect(initial[1].style.color).toBe('blue')
		view<MockSpan>(3).style.fontSize = 25
		expect(initial[1].style.fontSize).toBe(25)
		apply(update(3, { style: { fontWeight: unsetValue, color: unsetValue } }))
		expect(initial[1].style.color).toBeUndefined()
	})
	it('inherits through multiple nested spans, including plain text on either side', () => {
		const { apply, view, label } = mixed()
		apply(
			create(6, 'span', { style: { fontStyle: 'italic' } }),
			create(7, '#text', { value: 'deep' }),
			create(8, '#text', { value: 'tail' }),
			insert(6, 3),
			insert(7, 6),
			insert(8, 3),
		)
		expect(text(label)).toBe('abdeeptailc')
		const deep = runs(label)[2]
		expect(deep.style.fontWeight).toBe('bold')
		expect(deep.style.fontStyle).toBe('italic')
		view<MockSpan>(3).style.fontWeight = 'normal'
		expect(deep.style.fontWeight).toBe('normal')
		apply(update(6, { style: { fontWeight: 'bold' } }))
		expect(deep.style.fontWeight).toBe('bold')
		expect(view<MockSpan>(6).parent).toBe(view(3))
	})
	it('moves rich groups between labels and clears the old owner', () => {
		const { apply, view, label } = mixed()
		const old = label.formattedText!
		apply(create(6, 'label'), insert(6), move(3, 6))
		expect(label.formattedText).toBeNull()
		expect(label.text).toBe('ac')
		expect(old.spans.length).toBe(0)
		expect(text(view(6))).toBe('b')
		expect(view<MockSpan>(3).parent).toBe(view(6))
		apply(move(3, 1, 2))
		expect(text(label)).toBe('bac')
		expect(view<MockTextBase>(6).formattedText).toBeNull()
	})
	it('reorders plain leaves and rich groups using logical before positions', () => {
		const { apply, label } = mixed()
		apply(move(5, 1, 3))
		expect(text(label)).toBe('acb')
		apply(move(3, 1, 2))
		expect(text(label)).toBe('bac')
		apply(move(2, 3, 4))
		expect(text(label)).toBe('abc')
		expect(runs(label).map((s) => s.style.fontWeight)).toEqual(['bold', 'bold', undefined])
		apply(move(2, 1, 3))
		expect(text(label)).toBe('abc')
		expect(runs(label)[0].style.fontWeight).toBeUndefined()
	})
	it('preserves explicit FormattedString and Span identities and rejects unsafe parent reuse', () => {
		const { apply, view } = mount(new MockLayoutBase())
		apply(
			create(1, 'label'),
			create(2, 'formattedstring'),
			create(3, 'span', { text: 'first' }),
			create(4, 'span', { text: 'second' }),
			insert(1),
			insert(2, 1),
			insert(3, 2),
			insert(4, 2),
		)
		const formatted = view<MockFormattedString>(2)
		expect(view<MockTextBase>(1).formattedText).toBe(formatted)
		expect(runs(formatted)).toEqual([view(3), view(4)])
		apply(move(4, 2, 3))
		expect(runs(formatted)).toEqual([view(4), view(3)])
		apply(remove(3, 2))
		expect(view<MockSpan>(3).parent).toBeNull()
		apply(remove(2, 1))
		expect(view<MockTextBase>(1).formattedText).toBeNull()
		expect(formatted.parent).toBeNull()
	})
	it('routes native link events to the source span and removes projected listeners', () => {
		const { apply, view, label, dispatched } = mixed()
		apply(event(3, 'linkTap', listener(9)))
		const run = runs(label)[1]
		run.notify({ eventName: 'linkTap', object: run })
		expect(dispatched).toHaveLength(1)
		expect((dispatched[0].data as any).object).toBe(view(3))
		apply(event(3, 'linkTap', null))
		run.notify({ eventName: 'linkTap', object: run })
		expect(dispatched).toHaveLength(1)
		apply(remove(3, 1), destroy(3), destroy(4))
		expect(run.handlers.get('linkTap')?.size ?? 0).toBe(0)
	})
	it('cleans native and logical ownership when a whole text subtree is destroyed', () => {
		const { apply, view, label, container } = mixed()
		const group = view<MockSpan>(3)
		const formatted = label.formattedText!
		apply(remove(1), destroy(1), destroy(2), destroy(3), destroy(4), destroy(5))
		expect(container.nodes.size).toBe(0)
		expect(formatted.spans.length).toBe(0)
		expect(group.parent).toBeNull()
		expect(label.formattedText).toBeNull()
	})
	it('recreates rich source views on element replacement without losing children', () => {
		const { view, label } = mixed()
		const source = view<MockSpan>(3)
		class Replacement extends MockSpan {}
		registerElement('span', Replacement as never)
		expect(text(label)).toBe('abc')
		expect(source.parent).toBeNull()
		expect(view(3)).toBeInstanceOf(Replacement)
		registerElement('span', MockSpan as never)
	})
	it('flattens nested explicit groups without duplicate native parents', () => {
		const { apply, view } = mount(new MockLayoutBase())
		apply(
			create(1, 'label'),
			create(2, 'span', { style: { color: 'red' } }),
			create(3, 'formattedstring', { style: { fontStyle: 'italic' } }),
			create(4, '#text', { value: 'inside' }),
			create(5, 'span', { text: 'leaf', fontWeight: 'bold' }),
			insert(1),
			insert(2, 1),
			insert(3, 2),
			insert(4, 3),
			insert(5, 3),
		)
		const label = view<MockTextBase>(1)
		expect(text(label)).toBe('insideleaf')
		expect(runs(label)[0].style.color).toBe('red')
		expect(runs(label)[0].style.fontStyle).toBe('italic')
		expect(runs(label)[1].style.fontWeight).toBe('bold')
		apply(remove(3, 2), destroy(3), destroy(4), destroy(5))
		expect(view<MockSpan>(2).parent).toBe(label)
		expect(text(label)).toBe('')
	})
	it('keeps independent roots current when a style observer writes another root', () => {
		const first = mixed()
		const second = mixed()
		first.view<MockSpan>(3).style.on('fontWeightChange', () => {
			second.view<MockSpan>(3).style.color = 'green'
		})
		first.apply(update(3, { style: { fontWeight: 'normal' } }))
		expect(runs(first.label)[1].style.fontWeight).toBe('normal')
		expect(runs(second.label)[1].style.color).toBe('green')
		expect(first.label.formattedText).not.toBe(second.label.formattedText)
	})
	it('removes omitted inline formatting keys and reveals the text owner style', () => {
		const { apply, view, label } = mixed()
		apply(update(1, { style: { fontWeight: 'normal', color: 'blue' } }))
		expect(runs(label)[1].style.fontWeight).toBe('bold')
		apply(update(3, { style: { fontSize: 22 } }))
		expect(runs(label)[1].style.fontWeight).toBe('normal')
		expect(runs(label)[1].style.color).toBe('blue')
		expect(runs(label)[1].style.fontSize).toBe(22)
		expect(view<MockSpan>(3).style.fontWeight).toBe('normal')
	})
})
