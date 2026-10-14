import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { htmlDocument, parseHtmlText, validateHtmlProps } from '../src/html-text.ts'

const defaults = {
	fontSize: 16,
	fontFamily: 'System',
	fontWeight: '400',
	color: '#112233',
	style: {},
}

test('HTML defaults preserve markup and body styles, and escape generated font CSS', () => {
	const value = htmlDocument('<b>Hello &amp; 世界</b>', {
		...defaults,
		fontFamily: 'a"</style>',
		style: { textAlign: 'center', lineHeight: 24, fontStyle: 'italic' },
	})

	assert.ok(value.startsWith('<b>Hello &amp; 世界</b>'))
	assert.match(value, /font-size:16px/)
	assert.match(value, /color:#112233/)
	assert.match(value, /text-align:center;line-height:24px/)
	assert.equal(value.match(/<\/style>/g)?.length, 1)
	assert.match(value, /\\3c /)
})

test('HtmlView rejects invalid primitive content and accepts empty/default content', () => {
	for (const html of [12, {}, []]) {
		assert.throws(() => validateHtmlProps({ html }), /html must be a string/)
	}

	for (const html of ['', undefined, '<p>one</p>']) {
		validateHtmlProps({ html })
	}
})

test('HTML import uses UTF8 and the HTML document type, clears empty content and reports parse failure', () => {
	const native = globalThis as any
	const names = [
		'NSAttributedString',
		'NSString',
		'NSColorSpace',
		'NSUTF8StringEncoding',
		'NSDocumentTypeDocumentAttribute',
		'NSHTMLTextDocumentType',
		'NSCharacterEncodingDocumentAttribute',
	]

	const original = names.map((name) => Object.getOwnPropertyDescriptor(native, name))
	let imported: any[] = [],
		success = true

	try {
		Object.assign(native, {
			NSAttributedString: {
				alloc: () => ({
					initWithString: (string: string) => ({ string }),
					initWithDataOptionsDocumentAttributesError: (...args: any[]) => {
						imported = args
						return success ? { string: 'parsed' } : null
					},
				}),
			},
			NSString: {
				stringWithString: (value: string) => ({
					dataUsingEncoding: (encoding: string) => ({ value, encoding }),
				}),
			},
			NSColorSpace: { sRGBColorSpace: 'srgb' },
			NSUTF8StringEncoding: 'utf8',
			NSDocumentTypeDocumentAttribute: 'type',
			NSHTMLTextDocumentType: 'html',
			NSCharacterEncodingDocumentAttribute: 'encoding',
		})

		const color = {
			colorUsingColorSpace: () => ({ redComponent: 1, greenComponent: 0, blueComponent: 0 }),
		}

		assert.equal(parseHtmlText('<b>hi</b>', { ...defaults, color }).string, 'parsed')
		assert.equal(imported[0].encoding, 'utf8')
		assert.match(imported[0].value, /color:rgb\(255,0,0\)/)
		assert.deepEqual(imported.slice(1), [{ type: 'html', encoding: 'utf8' }, null, null])
		assert.equal(parseHtmlText('', { ...defaults, color }).string, '')
		success = false
		assert.throws(() => parseHtmlText('bad', { ...defaults, color }), /could not parse HTML/)
	} finally {
		for (const [index, name] of names.entries()) {
			if (original[index]) {
				Object.defineProperty(native, name, original[index]!)
			} else {
				delete native[name]
			}
		}
	}
})

const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	return source.slice(start, source.indexOf('\nfunction ', start + 1))
}

test('HtmlView rejects all JSX children before mutation, but is a valid layout child', () => {
	const api = runInNewContext(fn('validateTextNesting') + '\n({validateTextNesting})')
	for (const child of ['label', 'span', 'formattedstring', '#text', 'htmlview']) {
		assert.throws(() => api.validateTextNesting('htmlview', child), /takes html content/)
	}

	for (const parent of ['stacklayout', 'contentview', 'docklayout', 'rootlayout', 'gridlayout']) {
		api.validateTextNesting(parent, 'htmlview')
	}
})

test('HtmlView updates reconcile content only after font/color sources, preserving view identity', () => {
	let invalidations = 0,
		reconciles = 0

	const api = runInNewContext(fn('syncHtmlView') + '\n({syncHtmlView})', {
		parseHtmlText: (html: string, defaults: any) => ({ html, defaults }),
		queueLayoutReconcile: () => reconciles++,
	})

	const view: any = {
		font: { pointSize: 20, familyName: 'System' },
		textColor: '#ff0000',
		invalidateIntrinsicContentSize: () => invalidations++,
	}

	const node: any = {
		view,
		props: { html: '<b>first</b>', style: { lineHeight: 28 } },
		appliedFontWeight: '700',
	}

	api.syncHtmlView(node)
	assert.equal(view.attributedStringValue.html, '<b>first</b>')
	assert.equal(view.attributedStringValue.defaults.fontSize, 20)
	assert.equal(view.attributedStringValue.defaults.fontWeight, '700')
	node.props = {}
	view.font.pointSize = 16
	node.appliedFontWeight = undefined
	api.syncHtmlView(node)
	assert.equal(node.view, view)
	assert.equal(view.attributedStringValue.html, '')
	assert.equal(view.attributedStringValue.defaults.fontSize, 16)
	assert.equal(invalidations, 2)
	assert.equal(reconciles, 2)
})

test('HtmlView production ownership moves its native host between parents and releases it on destroy', () => {
	const noop = () => {}
	const view = () => ({
		subviews: [] as any[],
		superview: null as any,
		invalidateIntrinsicContentSize: noop,
		addSubview(child: any) {
			this.subviews.push(child)
			child.superview = this
		},
		removeFromSuperview() {
			if (this.superview) {
				this.superview.subviews.splice(this.superview.subviews.indexOf(this), 1)
			}

			this.superview = null
		},
	})

	const api = runInNewContext(
		['validateTextNesting', 'insert', 'detach', 'destroy'].map(fn).join('\n') +
			'\n({insert,destroy})',
		{
			VIEW_PARENT_TYPES: new Set(['contentview']),
			layoutView: (node: any) => node.view,
			arrangedView: (node: any) => node.view,
			deactivateSizeConstraints: noop,
			releasePlacementPins: noop,
			queueLayoutReconcile: noop,
			syncText: noop,
			syncScheme: noop,
			disposePressGestures: noop,
			panHandlersByView: new WeakMap(),
			layoutHandlers: new WeakMap(),
		},
	)

	const container: any = { nodes: new Map(), children: [] }
	const node = (id: number, type: string) => {
		const item = {
			id,
			type,
			view: view(),
			props: { html: '<b>retained</b>' },
			children: [],
			parent: null,
			container,
		}

		container.nodes.set(id, item)
		return item
	}

	const left: any = node(1, 'contentview'),
		right: any = node(2, 'contentview'),
		html: any = node(3, 'htmlview')

	const retained = html.view
	api.insert(container, 1, html, null)
	assert.equal(left.contentChild, html)
	api.insert(container, 2, html, null)
	assert.equal(left.contentChild, null)
	assert.equal(left.children.length, 0)
	assert.equal(html.view, retained)
	assert.equal(retained.superview, right.view)
	assert.equal(right.contentChild, html)
	api.destroy(html)
	assert.equal(retained.superview, null)
	assert.equal(html.parent, null)
	assert.equal(right.contentChild, null)
	assert.equal(right.children.length, 0)
})
