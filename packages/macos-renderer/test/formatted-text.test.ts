import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { textRuns, validateTextStyle } from '../src/formatted-text.ts'

const node = (type: string, props: any = {}, children: any[] = []) => ({
	type,
	props,
	children,
	text: '',
})

test('formatted containers compose ordered nested spans with inherited styling and local overrides', () => {
	const tree = node('formattedstring', { fontSize: 20, color: '#ff0000' }, [
		node('span', { text: 'a', fontWeight: 'bold' }, [
			node('span', { text: 'b', style: { color: '#0000ff' } }),
		]),
		node('span', { text: 3 }),
	])

	const runs = textRuns(tree, { fontFamily: 'system-ui', fontSize: 14 })
	assert.equal(runs.map((run) => run.text).join(''), 'ab3')
	assert.equal(runs[1].style.fontWeight, 'bold')
	assert.equal(runs[1].style.color, '#0000ff')
	assert.equal(runs[2].style.color, '#ff0000')
	assert.equal(runs[2].style.fontSize, 20)
	assert.equal(tree.children[1].props.fontSize, undefined)
})

test('removed overrides restore inheritance, reordering and reparenting recompute without stale runs', () => {
	const a = node('span', { text: 'a', color: '#0000ff' }),
		b = node('span', { text: 'b' })

	const tree = node('formattedstring', { fontSize: 18, color: '#ff0000' }, [a, b])
	a.props = { text: 'A' }
	tree.children.reverse()
	assert.deepEqual(
		textRuns(tree).map((run) => [run.text, run.style.color]),
		[
			['b', '#ff0000'],
			['A', '#ff0000'],
		],
	)

	tree.props = {}
	tree.children = [b]
	assert.equal(textRuns(tree, { fontSize: 14 })[0].style.fontSize, 14)
	assert.equal(
		textRuns(node('formattedstring', { color: '#00ff00' }, [a]))[0].style.color,
		'#00ff00',
	)

	tree.children = []
	assert.deepEqual(textRuns(tree), [])
})

test('invalid defining text styles fail before host creation', () => {
	for (const props of [
		{ fontSize: 0 },
		{ fontSize: Infinity },
		{ fontFamily: 3 },
		{ fontStyle: 'slanted' },
		{ textDecoration: 'blink' },
		{ style: [] },
	]) {
		assert.throws(() => validateTextStyle(props, () => {}), /AppKit formatted text/)
	}
})

const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	return source.slice(start, source.indexOf('\nfunction ', start + 1))
}

const api = runInNewContext(fn('validateTextNesting') + '\n({validateTextNesting})')

test('formattedstring is viewless and accepts spans only under all five text-bearing hosts', () => {
	for (const type of ['label', 'button', 'textfield', 'textview', 'searchbar']) {
		api.validateTextNesting(type, 'formattedstring')
	}

	api.validateTextNesting('formattedstring', 'span')
	api.validateTextNesting('span', 'span')
	api.validateTextNesting('span', '#text')
	for (const type of ['label', '#text', 'proxyviewcontainer', 'formattedstring']) {
		assert.throws(() => api.validateTextNesting('formattedstring', type), /only span/)
	}

	assert.throws(
		() => api.validateTextNesting('stacklayout', 'formattedstring'),
		/text-bearing parent/,
	)

	assert.throws(() => api.validateTextNesting('span', 'button'), /only span or text/)
})

test('logical text hosts reparent, move, remove and dispose through production ownership paths', () => {
	const noop = () => {}
	const runtime = runInNewContext(
		[
			'parentReference',
			'resolveParentNode',
			'canContainView',
			'textContent',
			'syncText',
			'validateTextNesting',
			'detach',
			'insert',
			'remove',
			'destroy',
		]
			.map(fn)
			.join('\n') + '\n({insert,remove,destroy})',
		{
			VIEW_PARENT_TYPES: new Set(),
			composeAttributedText: (
				children: any[],
				_view: any,
				_props: any,
				_font: any,
				_color: any,
				defaults: any,
			) =>
				children
					.flatMap((child) => textRuns(child, defaults))
					.map((run) => run.text)
					.join(''),
			fontForFamilyStyle: noop,
			nativeColor: noop,
			setLabelText: (parent: any, text: string) => {
				parent.view.stringValue = text
			},
			queueLayoutReconcile: noop,
			deactivateSizeConstraints: noop,
			releasePlacementPins: noop,
			disposePressGestures: noop,
			layoutHandlers: new Map(),
		},
	)

	const container: any = { nodes: new Map(), children: [] }
	const create = (id: number, type: string, props: any = {}) => {
		const item: any = {
			...node(type, props),
			id,
			parent: null,
			container,
			view: type === 'label' ? { invalidateIntrinsicContentSize: noop } : null,
		}

		if (item.view) {
			Object.defineProperty(item.view, 'attributedStringValue', {
				set(value) {
					this.stringValue = value
				},
			})
		}

		container.nodes.set(id, item)
		return item
	}

	const left = create(1, 'label', { text: 'left' }),
		right = create(2, 'label', { text: 'right' })

	const formatted = create(3, 'formattedstring'),
		a = create(4, 'span', { text: 'A' }),
		b = create(5, 'span', { text: 'B' })

	runtime.insert(container, 1, formatted, null)
	runtime.insert(container, 3, a, null)
	runtime.insert(container, 3, b, 4)
	assert.equal(left.view.stringValue, 'BA')
	runtime.insert(container, 2, formatted, null)
	assert.equal(left.view.stringValue, 'left')
	assert.equal(right.view.stringValue, 'BA')
	assert.equal(a.parent, formatted)
	runtime.remove(container, 3, b)
	assert.equal(right.view.stringValue, 'A')
	runtime.remove(container, 3, a)
	assert.equal(right.view.stringValue, '')
	runtime.remove(container, 2, formatted)
	assert.equal(right.view.stringValue, 'right')
	runtime.insert(container, 2, formatted, null)
	runtime.insert(container, 3, a, null)
	runtime.destroy(formatted)
	assert.equal(formatted.parent, null)
	assert.equal(a.parent, null)
	assert.equal(formatted.children.length, 0)
	assert.equal(right.view.stringValue, 'right')
})
