import ListView, {
	listViewRef,
	listViewRefs,
	rowRefs,
	listViewEvents,
	factoryHosts,
	factoryRefs,
} from './ListView'

export async function checkListViewLifecycle(root: any, nativeWindow: any) {
	const debug = root.__macosDebug
	const check = (value: any, message: string) => {
		if (!value) {
			throw new Error(message)
		}
	}

	const settle = () =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				nativeWindow.contentView.layoutSubtreeIfNeeded()
				resolve()
			}, 100),
		)

	const phase = async (value: number) => {
		root.render(ListView, { phase: value })
		await settle()
	}

	const cell = (view: any, index: number) =>
		view.documentView.viewAtColumnRowMakeIfNecessary(0, index, true)

	const texts = (view: any): string => {
		const children = Array.from({ length: Number(view?.subviews?.count ?? 0) }, (_, i) =>
			view.subviews.objectAtIndex(i),
		)

		return (
			(view?.stringValue == null ? '' : String(view.stringValue)) + children.map(texts).join('')
		)
	}

	await phase(0)
	const first = listViewRef.current,
		table = first.documentView

	check(
		first instanceof NSScrollView &&
			table instanceof NSTableView &&
			Number(table.numberOfRows) === 2,
		'ListView native scroll/table mount failed',
	)

	const row0 = cell(first, 0),
		label0 = rowRefs[0].current

	await settle()
	check(
		texts(row0) === 'A:0' && row0.bindingContext === 'A',
		'ListView renderItem/bindingContext failed',
	)

	check(
		first.superview === debug.findId('listview-left') &&
			Number(first.frame.size.width) === 240 &&
			Number(first.frame.size.height) === 70,
		'ListView nested geometry failed',
	)

	const defaultSeparator =
		cell(debug.findId('listview-default'), 0) &&
		debug.findId('listview-default').documentView.gridColor

	check(
		texts(cell(debug.findId('listview-default'), 0)) === '42',
		'ListView default $value label failed',
	)

	const stringCell = cell(debug.findId('listview-string'), 0)
	await settle()
	check(texts(stringCell) === 'First5', 'ListView nested string template binding failed')
	const factoryCell = cell(debug.findId('listview-factory'), 0)
	await settle()
	check(
		texts(factoryCell) === 'Factory' && factoryHosts[0].bindingContext === 'bound0',
		'ListView default factory precedence/binding failed',
	)

	const loading = listViewEvents.find(
		(event) => event.eventName === 'itemLoading' && event.index === 0,
	)

	check(
		loading?.object === first &&
			loading.view === row0 &&
			Object.getOwnPropertyDescriptor(loading, 'view')?.writable === false,
		'ListView readonly itemLoading payload failed',
	)

	// Native action/delegate bridge evidence; this does not exercise OS input.
	const tapBefore = listViewEvents.filter((event) => event.eventName === 'itemTap').length
	check(
		listViewEvents.some((event) => event.eventName === 'loadMoreItems' && event.object === first),
		'ListView native load-more delegate payload failed',
	)

	check(tapBefore === 0, 'ListView should not emit tap during mount')
	table.selectRowIndexesByExtendingSelection(NSIndexSet.indexSetWithIndex(0), false)
	NSApplication.sharedApplication.sendActionToFrom(table.action, table.target, table)
	const tap = listViewEvents.find((event) => event.eventName === 'itemTap')
	check(
		tap?.index === 0 && tap.object === first && tap.view === row0,
		'ListView native target/action itemTap payload failed',
	)

	await phase(1)
	check(
		listViewRef.current === first &&
			cell(first, 0) === row0 &&
			rowRefs[0].current === label0 &&
			texts(row0) === 'C:1' &&
			row0.bindingContext === 'C',
		'ListView same-count rebind lost root/host identity or closure update',
	)

	check(
		texts(cell(debug.findId('listview-string'), 0)) === 'Second5',
		'ListView string rebind failed',
	)

	check(
		factoryRefs.includes('cleanup') && !factoryHosts[0].superview,
		'ListView callable rebind did not unmount old owned root: hosts=' +
			factoryHosts.length +
			' refs=' +
			factoryRefs.map((ref) => (typeof ref === 'string' ? ref : 'view')).join(',') +
			' firstParent=' +
			!!factoryHosts[0].superview,
	)

	await phase(2)
	check(
		listViewRef.current === first &&
			Number(table.numberOfRows) === 0 &&
			rowRefs.every((ref) => ref.current == null),
		'ListView removed items/renderItem did not clear rows/refs',
	)

	check(
		table.gridColor.isEqual(defaultSeparator),
		'ListView removed separatorColor did not restore default',
	)

	const eventsBefore = listViewEvents.length
	table.delegate['tableView:didAddRowView:forRow:'](table, NSTableRowView.alloc().init(), -1)
	check(listViewEvents.length === eventsBefore, 'ListView removed handler remained active')
	await phase(3)
	check(
		listViewRef.current === first &&
			Number(first.frame.origin.y) < Number(debug.findId('listview-tail').frame.origin.y),
		'ListView keyed order/retained identity failed',
	)

	await phase(4)
	const moved = listViewRef.current
	check(
		moved !== first &&
			moved.superview === debug.findId('listview-right') &&
			!first.superview &&
			first.documentView == null &&
			table.delegate == null &&
			table.target == null,
		'ListView parent change did not release old ownership',
	)

	await phase(5)
	const replaced = listViewRef.current
	check(
		replaced !== moved &&
			replaced.superview === debug.findId('listview-left') &&
			moved.documentView == null,
		'ListView replacement failed',
	)

	await phase(6)
	check(
		listViewRef.current == null && replaced.documentView == null && !replaced.superview,
		'ListView removal failed',
	)

	await phase(7)
	const retained = listViewRef.current,
		retainedTable = retained.documentView

	cell(retained, 0)
	await settle()
	root.unmount()
	check(
		listViewRef.current == null &&
			rowRefs.every((ref) => ref.current == null) &&
			!retained.superview &&
			retained.documentView == null &&
			retainedTable.delegate == null &&
			retainedTable.dataSource == null &&
			retainedTable.target == null,
		'ListView retained refs/root teardown failed',
	)

	check(
		listViewRefs.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'ListView array callback ref lifecycle failed',
	)

	check(
		factoryHosts.every((host) => !host.superview && host.bindingContext == null),
		'ListView factory teardown retained binding/view',
	)

	console.log('PACKED_LISTVIEW_OK')
}
