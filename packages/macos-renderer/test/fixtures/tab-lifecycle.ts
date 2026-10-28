import Tabs, {
	tabRef,
	itemRef,
	childRef,
	tabEvents,
	tabRefs,
	ImperativeTabs,
	imperativeRefs,
	updateTabArrays,
	contentEffects,
} from './Tab'

export async function checkTabLifecycle(root: any, nativeWindow: any) {
	const debug = root.__macosDebug
	const check = (condition: any, message: string) => {
		if (!condition) {
			throw new Error(message)
		}
	}

	const settle = () =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				nativeWindow.contentView.layoutSubtreeIfNeeded()
				resolve()
			}, 80),
		)

	const advance = async () => {
		debug.pressId('advance-tabs')
		await settle()
	}

	const labels = (view: any) =>
		Array.from({ length: Number(view.numberOfTabViewItems) }, (_, i) =>
			String(view.tabViewItemAtIndex(i).label),
		).join('|')

	root.render(Tabs, {})
	await settle()
	const windowHeight = Number(nativeWindow.frame.size.height)
	const tabs = tabRef.current,
		item = itemRef.current,
		content = childRef.current,
		contentRoot = item.contentRoot

	check(
		Number(debug.findId('tabs-empty').numberOfTabViewItems) === 0,
		'TabView empty default failed',
	)

	check(
		labels(tabs) === 'First|Same' && tabs.selectedTabViewItem === tabs.tabViewItemAtIndex(1),
		'TabView initial items/selection failed',
	)

	check(tabs.tabViewItemAtIndex(1).image, 'TabView system-symbol icon failed')
	check(
		item.view === null &&
			item.type === 'tabviewitem' &&
			item.tabNativeItem.view &&
			item.tabNativeItem.image &&
			contentRoot === null &&
			content.superview,
		'TabView logical ref/content root/icon failed',
	)

	const bounds = tabs.alignmentRectForFrame(tabs.frame)
	check(
		Number(bounds.size.width) === 240 && Number(bounds.size.height) === 100,
		'TabView nesting/layout failed',
	)

	check(
		tabEvents.some(
			(e) =>
				e.eventName === 'selectedIndexChanged' &&
				e.newIndex === 1 &&
				e.oldIndex === -1 &&
				e.object === tabs,
		),
		'TabView changed payload failed',
	)

	check(
		tabEvents.some(
			(e) => e.eventName === 'selectedIndexChange' && e.value === 1 && e.object === tabs,
		),
		'TabView change payload failed',
	)

	const before = tabEvents.length
	tabs.selectTabViewItemAtIndex(0)
	await settle()
	check(
		Number(content.frame.size.width) > 0 && Number(content.frame.size.height) > 0,
		'TabView selected content layout failed',
	)

	check(
		tabEvents.length === before + 2 &&
			tabEvents.at(-1).oldIndex === 1 &&
			tabEvents.at(-1).newIndex === 0,
		'TabView native selection delegate failed',
	)

	await advance()
	check(
		Math.abs(Number(nativeWindow.frame.size.height) - windowHeight) < 1,
		'TabView reorder changed the host window height',
	)
	check(
		tabRef.current === tabs &&
			itemRef.current === item &&
			childRef.current === content &&
			item.contentRoot === contentRoot &&
			labels(tabs) === 'Same|Updated|Same' &&
			tabs.selectedTabViewItem === tabs.tabViewItemAtIndex(2) &&
			String(content.stringValue) === 'a-1',
		'TabView reorder/update/retained content identity failed: ' +
			JSON.stringify({
				tab: tabRef.current === tabs,
				item: itemRef.current === item,
				child: childRef.current === content,
				root: item.contentRoot === contentRoot,
				labels: labels(tabs),
				selected: Number(tabs.indexOfTabViewItem(tabs.selectedTabViewItem)),
				text: String(content.stringValue),
			}),
	)

	check(tabs.tabViewItemAtIndex(2).image, 'TabView font-glyph icon failed')
	await advance()
	check(
		labels(tabs) === '|' &&
			item.tabNativeItem.image === null &&
			tabs.selectedTabViewItem === tabs.tabViewItemAtIndex(0),
		'TabView dropped props/defaults failed',
	)

	await advance()
	check(
		labels(tabs) === 'Updated' && itemRef.current === item && childRef.current === content,
		'TabView item removal/retention failed',
	)

	await advance()
	const moved = tabRef.current
	check(
		moved !== tabs &&
			!tabs.superview &&
			Number(tabs.numberOfTabViewItems) === 0 &&
			item.contentRoot === null &&
			!content.superview &&
			tabRefs.join() === 'attach,cleanup,attach',
		'TabView authored parent change/teardown failed',
	)

	await advance()
	const replaced = tabRef.current,
		replacedItem = itemRef.current

	check(
		replaced !== moved &&
			!moved.superview &&
			tabRefs.join() === 'attach,cleanup,attach,cleanup,attach',
		'TabView replacement/ref cleanup failed',
	)

	await advance()
	check(
		tabRef.current === null &&
			itemRef.current === null &&
			childRef.current === null &&
			replacedItem.contentRoot === null &&
			Number(replaced.numberOfTabViewItems) === 0,
		'TabView removal/ref/root cleanup failed',
	)

	await advance()
	check(tabRef.current && itemRef.current && childRef.current, 'TabView reinsertion failed')
	const last = tabRef.current,
		lastItem = itemRef.current

	root.unmount()
	await settle()
	check(
		!last.superview &&
			Number(last.numberOfTabViewItems) === 0 &&
			lastItem.contentRoot === null &&
			tabRef.current === null &&
			childRef.current === null &&
			debug.metrics().nativeViewCount === 0,
		'TabView final teardown failed',
	)

	console.log('PACKED_TABVIEW_OK')
}

export async function checkImperativeTabLifecycle(root: any, nativeWindow: any) {
	const check = (condition: any, message: string) => {
		if (!condition) {
			throw new Error(message)
		}
	}

	const settle = () =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				nativeWindow.contentView.layoutSubtreeIfNeeded()
				resolve()
			}, 60),
		)

	root.render(ImperativeTabs, {})
	await settle()
	const left = root.__macosDebug.findId('tabs-imperative-left'),
		right = root.__macosDebug.findId('tabs-imperative-right')

	const a = imperativeRefs.a.current,
		b = imperativeRefs.b.current

	check(
		a && b && a.contentRoot == null && imperativeRefs.child.current === null,
		'TabView unassigned logical handles mounted content early',
	)

	updateTabArrays([a, b], [])
	await settle()
	const native = a.tabNativeItem,
		child = imperativeRefs.child.current,
		contentRoot = a.contentRoot

	check(
		Number(left.numberOfTabViewItems) === 2 &&
			left.tabViewItemAtIndex(0) === native &&
			child &&
			contentRoot === null &&
			contentEffects.join() === 'mount',
		'TabView imperative mount failed',
	)

	updateTabArrays([b, a], [])
	await settle()
	check(
		left.tabViewItemAtIndex(1) === native &&
			a.contentRoot === contentRoot &&
			imperativeRefs.child.current === child,
		'TabView imperative reorder lost item/root/ref identity',
	)

	updateTabArrays([b], [a])
	await settle()
	check(
		Number(left.numberOfTabViewItems) === 1 &&
			right.tabViewItemAtIndex(0) === native &&
			a.contentRoot === contentRoot &&
			imperativeRefs.child.current === child,
		'TabView imperative ownership transfer failed',
	)

	let rejected = false
	try {
		a.contentRoot = {}
	} catch (error) {
		rejected = /cannot be reassigned/.test(String(error))
	}

	check(rejected, 'TabView assigned content root replacement was not rejected')
	updateTabArrays([], [])
	await settle()
	check(
		a === imperativeRefs.a.current &&
			a.contentRoot === null &&
			imperativeRefs.child.current === null &&
			!child.superview &&
			contentEffects.join() === 'mount,unmount',
		'TabView imperative removal did not unmount content/cleanup retained child ref',
	)

	updateTabArrays([a], [])
	await settle()
	check(
		a.tabNativeItem === native &&
			a.contentRoot === null &&
			imperativeRefs.child.current &&
			imperativeRefs.child.current !== child &&
			contentEffects.join() === 'mount,unmount,mount',
		'TabView imperative remount failed',
	)

	root.unmount()
	await settle()
	check(
		a.contentRoot === null &&
			imperativeRefs.a.current === null &&
			imperativeRefs.child.current === null &&
			!left.superview &&
			contentEffects.join() === 'mount,unmount,mount,unmount',
		'TabView imperative teardown failed',
	)

	console.log('PACKED_TABVIEW_ITEMS_OK')
}
