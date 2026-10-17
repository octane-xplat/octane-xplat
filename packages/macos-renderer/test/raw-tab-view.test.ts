import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

function fixture() {
	class ObjectHost {
		static alloc() {
			return new this()
		}
		static new() {
			return new this()
		}
		init() {
			return this
		}
	}

	class View extends ObjectHost {
		removed = false
		removeFromSuperview() {
			this.removed = true
		}
	}

	class Item extends ObjectHost {
		initWithIdentifier(_id: string) {
			return this
		}
		sizeOfLabel() {
			return { width: 10, height: 12 }
		}
		drawLabelInRect() {}
	}

	class Tabs extends View {
		items: any[] = []
		selectedTabViewItem: any
		delegate: any
		get numberOfTabViewItems() {
			return this.items.length
		}
		tabViewItemAtIndex(index: number) {
			assert.ok(index < this.items.length)
			return this.items[index]
		}
		insertTabViewItemAtIndex(item: any, index: number) {
			this.items.splice(index, 0, item)
		}
		removeTabViewItem(item: any) {
			this.items.splice(this.items.indexOf(item), 1)
		}
		indexOfTabViewItem(item: any) {
			return this.items.indexOf(item)
		}
		selectTabViewItemAtIndex(index: number) {
			this.selectedTabViewItem = this.items[index]
			this.delegate?.tabViewDidSelectTabViewItem(this, this.selectedTabViewItem)
		}
	}

	const requests: any[] = []
	const code = stripTypeScriptTypes(
		readFileSync(new URL('../src/tab-view.ts', import.meta.url), 'utf8'),
	)
		.replace(/^import\b[\s\S]*?(?:from\s*)?['"][^'"]*['"];?\s*\n/gm, '')
		.replace(/export /g, '')

	const api = runInNewContext(
		code +
			'\n({makeTabView,makeTabItem,syncTabView,syncTabItem,detachTabItem,releaseTabView,releaseTabItem,validateTabProps,flushTabViews,configureTabContentRoots,__tabItemProps})',
		{
			defineUniversalComponent: (_: any, render: any) => render,
			universalPlan: (_: any, plan: any) => plan,
			universalValue() {},
			universalProps() {},
			queueMicrotask,
			NSObject: ObjectHost,
			NSView: View,
			NSTabView: Tabs,
			NSTabViewItem: Item,
			NSTabViewDelegate: {},
			registerGestureClass() {},
			loadImage: (source: any) => ({ source }),
			NSFontAttributeName: 'font',
			NSForegroundColorAttributeName: 'color',
			NSColor: { labelColor: 'default' },
			resolveFont: (size: any, weight: any, family: any) => ({ size, weight, family }),
			NSAttributedString: {
				alloc: () => ({
					initWithStringAttributes(text: any, attributes: any) {
						return {
							size: () => ({ width: 10, height: attributes.font.size }),
							drawAtPoint() {},
							text,
							attributes,
						}
					},
				}),
			},
			NSImage: {
				imageWithSystemSymbolNameAccessibilityDescription: (symbol: any) => ({ symbol }),
				imageNamed: (name: any) => ({ name }),
				alloc: () => ({
					initWithData: (data: any) => ({ data }),
					initWithSize: (size: any) => ({ size, lockFocus() {}, unlockFocus() {} }),
				}),
			},
			NSURL: { URLWithString: (value: any) => value },
			NSURLSession: {
				sharedSession: {
					dataTaskWithURLCompletionHandler(url: any, callback: any) {
						const request = {
							url,
							callback,
							cancelled: false,
							resume() {},
							cancel() {
								this.cancelled = true
							},
						}

						requests.push(request)
						return request
					},
				},
			},
			NSBundle: { mainBundle: { resourcePath: '/resources' } },
		},
	)

	api.configureTabContentRoots(
		() => ({
			renders: 0,
			unmounts: 0,
			render() {
				this.renders++
			},
			unmount() {
				this.unmounts++
			},
		}),
		(color: any) => color,
	)

	let id = 0
	const events: any[] = []
	const bar = () => {
		const node: any = {
			id: ++id,
			props: {
				onSelectedIndexChange: (e: any) => events.push(e),
				onSelectedIndexChanged: (e: any) => events.push(e),
			},
			children: [],
			container: { layoutDirty: null },
		}

		node.view = api.makeTabView(node)
		return node
	}

	const item = (title = '') => {
		const node: any = {
			id: ++id,
			type: 'tabviewitem',
			view: null,
			props: { title },
			children: [],
			container: {},
		}

		api.makeTabItem(node)
		api.syncTabItem(node)
		return node
	}

	return { api, bar, item, events, requests }
}

test('TabView defaults, clamping, unchanged suppression, native selection and callback payloads', () => {
	const { api, bar, item, events } = fixture(),
		node = bar()

	api.syncTabView(node)
	assert.equal(node.tabIndex, -1)
	assert.equal(events.length, 0)
	node.children = [item('A'), item('B')]
	api.syncTabView(node)
	assert.equal(node.tabIndex, 0)
	assert.equal(events.length, 2)
	assert.deepEqual(
		{ ...events[0] },
		{ eventName: 'selectedIndexChanged', object: node.view, value: 0, oldIndex: -1, newIndex: 0 },
	)

	node.props.selectedIndex = 99
	api.syncTabView(node)
	assert.equal(node.tabIndex, 1)
	api.syncTabView(node)
	assert.equal(events.length, 4)
	delete node.props.selectedIndex
	api.syncTabView(node)
	assert.equal(node.tabIndex, 0)
	node.view.selectTabViewItemAtIndex(1)
	assert.equal(node.tabIndex, 1)
	assert.equal(events.at(-1).eventName, 'selectedIndexChange')
	delete node.props.onSelectedIndexChange
	delete node.props.onSelectedIndexChanged
	node.view.selectTabViewItemAtIndex(0)
	assert.equal(events.length, 8)
})

test('TabView preserves item/content identity across imperative updates, ordering and parent transfer', () => {
	const { api, bar, item } = fixture(),
		left = bar(),
		right = bar(),
		a = item('Same'),
		b = item('Same')

	left.props.items = [a, b]
	api.syncTabView(left)
	const host = a.childHost,
		native = a.tabNativeItem,
		root = a.tabContentRoot

	left.props.items = [b, a]
	api.syncTabView(left)
	assert.deepEqual(left.view.items, [b.tabNativeItem, native])
	assert.equal(a.childHost, host)
	assert.equal(a.tabContentRoot, root)
	assert.equal(a.view, null)
	right.props.items = [a]
	api.syncTabView(right)
	assert.deepEqual(left.view.items, [b.tabNativeItem])
	assert.deepEqual(right.view.items, [native])
	assert.equal(a.childHost, host)
	api.releaseTabView(right)
	assert.equal(root.unmounts, 1)
	assert.equal(a.tabContentRoot, null)
	assert.equal(right.view.delegate, null)
	assert.equal(right.view.items.length, 0)
	api.releaseTabItem(a)
	assert.equal(a.tabNativeItem.view, null)
	assert.equal(a.childHost, undefined)
	assert.throws(() => api.validateTabProps('tabview', { items: [a] }), /live tabviewitem/)
})

test('TabView item title/icon updates restore defaults; ordinary tab labels measure and draw icons', () => {
	const { api, bar, item } = fixture(),
		node = bar(),
		a = item('Before')

	node.children = [a]
	api.syncTabView(node)
	a.props = { title: 'After', iconSource: 'res://Icon' }
	api.syncTabItem(a)
	assert.equal(a.tabNativeItem.label, 'After')
	assert.equal(a.tabNativeItem.image.name, 'Icon')
	assert.equal(a.tabNativeItem.sizeOfLabel(false).width, 30)
	let draws = 0
	a.props.iconSource = {
		macos: {
			drawInRectFromRectOperationFraction() {
				draws++
			},
		},
	}

	api.syncTabItem(a)
	a.tabNativeItem.drawLabelInRect(false, {
		origin: { x: 0, y: 0 },
		size: { width: 40, height: 20 },
	})

	assert.equal(draws, 1)
	a.props = {}
	api.syncTabItem(a)
	assert.equal(a.tabNativeItem.label, '')
	assert.equal(a.tabNativeItem.image, null)
	assert.equal(a.tabNativeItem.sizeOfLabel(false).width, 10)
})

test('TabView invalid imperative values and assigned content replacement fail explicitly', () => {
	const { api, item } = fixture(),
		a = item()

	for (const items of [{}, [1], [{}], [{ type: 'tabviewitem' }], [a, a]]) {
		assert.throws(() => api.validateTabProps('tabview', { items }), /handles/)
	}

	for (const selectedIndex of ['1', NaN, 1.5]) {
		assert.throws(() => api.validateTabProps('tabview', { selectedIndex }), /integer/)
	}

	assert.throws(() => api.validateTabProps('tabviewitem', { view: {} }), /cannot be reassigned/)
	assert.throws(() => api.validateTabProps('tabviewitem', { title: 1 }), /string/)
	assert.throws(() => api.validateTabProps('tabviewitem', { iconSource: false }), /host image/)
})

test('TabView batches publish only the final ordered items and selection', () => {
	const { api, bar, item, events } = fixture(),
		node = bar(),
		a = item(),
		b = item()

	node.container.layoutDirty = new Set()
	node.children = [a]
	api.syncTabView(node)
	node.children = [b, a]
	node.props.selectedIndex = 1
	api.syncTabView(node)
	assert.equal(node.view.items.length, 0)
	node.container.layoutDirty = null
	api.flushTabViews(node.container)
	assert.deepEqual(node.view.items, [b.tabNativeItem, a.tabNativeItem])
	assert.equal(events.length, 2)
	assert.equal(events[0].newIndex, 1)
})

test('TabView transfers between two item arrays in one batch without unmounting the retained content root', () => {
	const { api, bar, item } = fixture(),
		left = bar(),
		right = bar(),
		a = item()

	const container: any = { layoutDirty: null }
	left.container = right.container = container
	left.props.items = [a]
	api.syncTabView(left)
	const root = a.tabContentRoot
	container.layoutDirty = new Set()
	left.props.items = []
	right.props.items = [a]
	api.syncTabView(left)
	api.syncTabView(right)
	container.layoutDirty = null
	api.flushTabViews(container)
	assert.equal(root.unmounts, 0)
	assert.equal(a.tabContentRoot, root)
	assert.equal(left.view.items.length, 0)
	assert.equal(right.view.items[0], a.tabNativeItem)
	right.props.items = []
	api.syncTabView(right)
	assert.equal(root.unmounts, 1)
	assert.equal(a.tabContentRoot, null)
})

test('TabView rejects invalid host icon objects before replacing an item', () => {
	const { api } = fixture()
	assert.throws(() => api.validateTabProps('tabviewitem', { iconSource: {} }), /NSImage/)
})

test('TabView remote icons cancel superseded requests and ignore completion after disposal', () => {
	const { api, item, requests } = fixture(),
		a = item()

	a.props.iconSource = 'https://example.test/icon.png'
	api.syncTabItem(a)
	assert.equal(requests.length, 1)
	requests[0].callback('image bytes', null, null)
	assert.equal(a.tabNativeItem.image.data, 'image bytes')
	a.props.iconSource = 'https://example.test/next.png'
	api.syncTabItem(a)
	assert.equal(requests[0].cancelled, true)
	a.props.iconSource = 'res://Local'
	api.syncTabItem(a)
	assert.equal(requests[1].cancelled, true)
	requests[1].callback('stale bytes', null, null)
	assert.equal(a.tabNativeItem.image.name, 'Local')
	a.props.iconSource = 'https://example.test/last.png'
	api.syncTabItem(a)
	api.releaseTabItem(a)
	assert.equal(requests[2].cancelled, true)
	requests[2].callback('late bytes', null, null)
	assert.equal(a.tabNativeItem.image, null)
})

test('TabView compiler spread adapter reads children once and preserves prop/key/ref ordering', () => {
	const { api } = fixture()
	let reads = 0
	const ref = {},
		children = {}

	const props = {
		key: 'a',
		ref,
		get children() {
			reads++
			return children
		},
	}

	const result = api.__tabItemProps(props)
	assert.equal(reads, 1)
	assert.equal(result.key, 'a')
	assert.equal(result.ref, ref)
	assert.equal(result.__tabContent, children)
	assert.equal('children' in result, false)
	assert.equal('children' in props, true)
	assert.equal('__tabContent' in api.__tabItemProps({ title: 'Title' }), false)
	assert.equal(api.__tabItemProps(null), null)
})

test('TabView system symbols and font glyph icons render and react to font-style changes', () => {
	const { api, item } = fixture(),
		a = item()

	a.props.iconSource = 'sys://gear'
	api.syncTabItem(a)
	assert.equal(a.tabNativeItem.image.symbol, 'gear')
	a.props = { iconSource: 'font://★', style: { fontSize: 24, color: '#2563eb' } }
	api.syncTabItem(a)
	const image = a.tabNativeItem.image
	assert.equal(image.size.height, 24)
	a.props = { iconSource: 'font://★' }
	api.syncTabItem(a)
	assert.notEqual(a.tabNativeItem.image, image)
	assert.equal(a.tabNativeItem.image.size.height, 17)
})

test('source-owned tab content publishes only its final native target and creates no content root', async () => {
	const { api, bar, item } = fixture(),
		left = bar(),
		right = bar(),
		a = item('Owned')

	const targets: any[] = []
	a.props.__portalContent = true
	a.props.__onContentTarget = (target: any) => targets.push(target)
	left.props.items = [a]
	api.syncTabView(left)
	await new Promise<void>((resolve) => queueMicrotask(resolve))
	assert.equal(a.contentRoot, null)
	assert.equal(targets.at(-1), a.childHost)
	targets.length = 0
	left.props.items = []
	api.syncTabView(left)
	right.props.items = [a]
	api.syncTabView(right)
	await new Promise<void>((resolve) => queueMicrotask(resolve))
	assert.deepEqual(targets, [a.childHost])
	right.props.items = []
	api.syncTabView(right)
	await new Promise<void>((resolve) => queueMicrotask(resolve))
	assert.equal(targets.at(-1), null)
	assert.equal(a.contentRoot, null)
})
