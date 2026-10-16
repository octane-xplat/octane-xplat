import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { listFactory, parseListTemplate } from '../src/list-template.ts'

function fixture() {
	const source = stripTypeScriptTypes(
		readFileSync(new URL('../src/list-view.ts', import.meta.url), 'utf8'),
	)
		.replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm, '')
		.replace(/^export /gm, '')

	const roots: any[] = [],
		released: any[] = []

	class View {
		static alloc() {
			return new this()
		}
		static extend(bag: any) {
			class Delegate extends View {}
			Object.assign(Delegate.prototype, bag, {
				numberOfRowsInTableView: bag['numberOfRowsInTableView:'],
				itemClicked: bag['itemClicked:'],
			})

			return Delegate
		}
		static indexSetWithIndexesInRange(range: any) {
			return range
		}
		[key: string]: any
		gridColor = 'default'
		subviews: any[] = []
		superview: any = null
		frame: any = {}
		recycled: any = null
		init() {
			return this
		}
		initWithFrame(frame: any) {
			this.frame = frame
			return this
		}
		initWithIdentifier(id: string) {
			this.identifier = id
			return this
		}
		addTableColumn() {}
		reloadData() {
			this.reloads = (this.reloads ?? 0) + 1
		}
		noteHeightOfRowsWithIndexesChanged() {}
		makeViewWithIdentifierOwner() {
			const host = this.recycled
			this.recycled = null
			return host
		}
		addSubview(child: any) {
			this.subviews.push(child)
			child.superview = this
		}
		removeFromSuperview() {
			if (this.superview) {
				this.superview.subviews = this.superview.subviews.filter((view: any) => view !== this)
			}

			this.superview = null
		}
		get leadingAnchor() {
			return this.anchor
		}
		get trailingAnchor() {
			return this.anchor
		}
		get topAnchor() {
			return this.anchor
		}
		get bottomAnchor() {
			return this.anchor
		}
		anchor = { constraintEqualToAnchor: () => ({ active: false }) }
	}

	const api = runInNewContext(source + '\n({makeListView,updateListView,disposeListView,states})', {
		NSView: View,
		NSScrollView: View,
		NSTableView: View,
		NSObject: View,
		NSTableColumn: View,
		NSIndexSet: View,
		NSTableViewDataSource: {},
		NSTableViewDelegate: {},
		NSTableViewColumnAutoresizingStyle: {},
		NSTableViewGridLineStyle: {},
		NSTableColumnResizingOptions: {},
		registerGestureClass() {},
		interop: { types: {} },
		listFactory,
		parseListTemplate,
		defineUniversalComponent: (_renderer: string, callback: any) => callback,
		universalPlan: (_renderer: string, root: any) => root,
		universalValue: (plan: any, values: any[]) => ({ plan, values }),
	})

	const view = api.makeListView({
		color: (color: any) => color,
		createRoot: (host: any) => {
			const root = {
				host,
				mounts: [] as any[],
				disposed: 0,
				render(_component: any, props: any) {
					this.mounts.push(props.render())
				},
				unmount() {
					this.disposed++
				},
			}

			roots.push(root)
			return root
		},
		releaseOwnedRoot: (host: any) => released.push(host),
	})

	const table = view.documentView
	const row = (index: number) =>
		table.delegate['tableView:viewForTableColumn:row:'](table, null, index)

	return {
		api,
		view,
		table,
		roots,
		released,
		row,
		View,
		update: (props: any) => api.updateListView(view, props),
	}
}

test('renderItem wins over templates; rebinds diff one retained row root and expose read-only item events', () => {
	const { update, row, roots, table, view } = fixture(),
		loading: any[] = [],
		taps: any[] = [],
		more: any[] = []

	const props = {
		items: ['A', 'B'],
		renderItem: (item: any, index: number) => item + index,
		itemTemplate: () => {
			throw new Error('wrong precedence')
		},
		onItemLoading: (event: any) => loading.push(event),
		onItemTap: (event: any) => taps.push(event),
		onLoadMoreItems: (event: any) => more.push(event),
	}

	update(props)
	const host = row(0)
	assert.equal(roots.length, 1)
	assert.equal(roots[0].mounts[0], 'A0')
	assert.equal(host.bindingContext, 'A')
	update({ ...props, items: ['C', 'D'] })
	assert.equal(row(0), host)
	assert.equal(roots.length, 1)
	assert.equal(roots[0].mounts.at(-1), 'C0')
	assert.equal(loading.at(-1).object, view)
	assert.equal(loading.at(-1).view, host)
	assert.throws(() => {
		loading[0].view = null
	}, TypeError)

	table.clickedRow = 0
	table.target.itemClicked(table)
	assert.equal(taps.length, 1)
	assert.equal(taps[0].eventName, 'itemTap')
	assert.equal(taps[0].index, 0)
	table.delegate['tableView:didAddRowView:forRow:'](table, {}, 1)
	assert.equal(more[0].eventName, 'loadMoreItems')
	assert.equal(more[0].object, view)
	update({ items: ['C', 'D'], renderItem: props.renderItem })
	table.target.itemClicked(table)
	assert.equal(taps.length, 1)
})

test('recycled renderItem host and root retain identity across row indices', () => {
	const f = fixture()
	f.update({ items: ['A', 'B'], renderItem: (item: any) => item })
	const host = f.row(0),
		root = f.roots[0]

	f.table.delegate['tableView:didRemoveRowView:forRow:'](f.table, { viewAtColumn: () => host }, 0)
	f.table.recycled = host
	assert.equal(f.row(1), host)
	assert.equal(f.roots.length, 1)
	assert.equal(root.mounts.at(-1), 'B')
	assert.equal(host.bindingContext, 'B')
})

test('callable templates own root disposal on rebind, recycle and list release; keyed default beats string', () => {
	const f = fixture(),
		hosts: any[] = []

	const factory = () => {
		const view = f.View.alloc().init()
		hosts.push(view)
		return view
	}

	const props = {
		items: ['A'],
		itemTemplate: '<Label/>',
		itemTemplates: [{ key: 'default', createView: factory }],
	}

	f.update(props)
	const cell = f.row(0),
		first = hosts[0]

	assert.equal(first.bindingContext, 'A')
	assert.equal(first.superview, cell)
	assert.equal(f.roots.length, 0)
	f.update({ ...props, items: ['B'] })
	assert.equal(f.released[0], first)
	assert.equal(first.superview, null)
	assert.equal(first.bindingContext, undefined)
	const second = hosts[1]
	f.table.delegate['tableView:didRemoveRowView:forRow:'](f.table, { viewAtColumn: () => cell }, 0)
	assert.equal(f.released[1], second)
	assert.equal(second.superview, null)
	f.row(0)
	const third = hosts[2]
	f.api.disposeListView(f.view)
	assert.equal(f.released.at(-1), third)
	assert.equal(third.superview, null)
})

test('string/default path updates binding values in retained roots and separator removal restores native default', () => {
	const f = fixture()
	f.update({
		items: [{ name: 'A' }],
		itemTemplate: '<Label text="{{ name }}"/>',
		separatorColor: 'red',
	})

	f.row(0)
	const root = f.roots[0]
	assert.equal(root.mounts[0].values[0].text, 'A')
	assert.equal(f.table.gridColor, 'red')
	f.update({ items: [{ name: 'B' }], itemTemplate: '<Label text="{{ name }}"/>' })
	assert.equal(root.mounts.at(-1).values[0].text, 'B')
	assert.equal(f.table.gridColor, 'default')
	f.update({ items: [42] })
	assert.equal(root.disposed, 1)
	assert.deepEqual(Array.from(f.roots.at(-1).mounts.at(-1).values), ['42'])
	f.update({})
	assert.equal(f.roots.at(-1).disposed, 1)
	assert.equal(f.table.dataSource.numberOfRowsInTableView(f.table), 0)
})

test('ItemsSource change subscriptions refresh, transfer and release without retained callbacks', () => {
	const f = fixture()
	const subscriptions = new Map()
	const source = {
		length: 1,
		value: 'A',
		getItem() {
			return this.value
		},
		on(name: string, callback: any) {
			subscriptions.set(name, callback)
		},
		off(name: string) {
			subscriptions.delete(name)
		},
	}

	f.update({ items: source })
	f.row(0)
	source.value = 'B'
	subscriptions.get('change')()
	assert.equal(f.roots[0].mounts.at(-1).values[0], 'B')
	f.update({ items: [] })
	assert.equal(subscriptions.size, 0)
	f.update({ items: source })
	const late = subscriptions.get('change')
	f.api.disposeListView(f.view)
	assert.equal(subscriptions.size, 0)
	late()
	assert.equal(f.table.delegate, null)
	assert.equal(f.table.dataSource, null)
	assert.equal(f.table.target, null)
	assert.equal(f.view.documentView, null)
	for (const root of f.roots) {
		assert.equal(root.disposed, 1)
	}
})

test('portal cells publish bindings without roots and ignore an obsolete row removal', () => {
	const f = fixture()
	const events: any[] = []
	const props = {
		items: ['A'],
		renderItem: (item: any) => item,
		__onCellTarget: (event: any) => events.push(event),
	}

	f.update(props)
	const host = f.row(0)
	const first = { viewAtColumn: () => host }
	const second = { viewAtColumn: () => host }
	f.table.delegate['tableView:didAddRowView:forRow:'](f.table, first, 0)
	assert.equal(f.roots.length, 0)
	assert.equal(events.at(-1).item, 'A')
	const generation = events.at(-1).generation
	f.update({ ...props, items: ['B'] })
	f.row(0)
	f.table.delegate['tableView:didAddRowView:forRow:'](f.table, second, 0)
	assert.equal(events.at(-1).item, 'B')
	assert.ok(events.at(-1).generation > generation)
	const before = events.length
	f.table.delegate['tableView:didRemoveRowView:forRow:'](f.table, first, 0)
	assert.equal(events.length, before)
	f.table.delegate['tableView:didRemoveRowView:forRow:'](f.table, second, 0)
	assert.equal(events.at(-1).type, 'release')
	assert.equal(f.roots.length, 0)
})
