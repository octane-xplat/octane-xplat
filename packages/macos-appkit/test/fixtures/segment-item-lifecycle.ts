import SegmentItems, { segmentItemRef, segmentItemEvents } from './SegmentItem'

export async function checkSegmentItemLifecycle(root: any, nativeWindow: any) {
	const debug = root.__macosDebug
	const check = (condition: boolean, message: string) => {
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
		debug.pressId('advance-item')
		await settle()
	}

	const titles = (view: any) =>
		Array.from({ length: Number(view.segmentCount) }, (_, i) =>
			String(view.labelForSegment(i)),
		).join('|')

	root.render(SegmentItems, {})
	await settle()
	const bar = debug.findId('item-bar'),
		first = segmentItemRef.current,
		sibling = debug.findId('item-first')

	check(
		first &&
			first.view === null &&
			first.type === 'segmentedbaritem' &&
			first.parent.view === bar &&
			debug.findId('segment-item') === first,
		'SegmentedBarItem logical identity/ref failed',
	)

	check(
		titles(bar) === 'Same|Same||Last' && Number(bar.selectedSegment) === 1,
		'SegmentedBarItem duplicate/empty/order failed',
	)

	check(
		Number(bar.frame.size.width) > 0 && Number(bar.frame.size.height) > 0 && bar.superview,
		'SegmentedBarItem parent layout failed',
	)

	const natural = debug.findId('item-natural'),
		naturalWidth = Number(natural.frame.size.width)

	check(naturalWidth > 0, 'SegmentedBarItem natural initial size failed')
	await advance()
	check(
		debug.findId('item-natural') === natural && Number(natural.frame.size.width) > naturalWidth,
		'SegmentedBarItem title update did not reconcile natural parent layout',
	)

	check(
		segmentItemRef.current === first &&
			debug.findId('item-first') === sibling &&
			titles(bar) === 'Last|Updated||Same|Inserted',
		'SegmentedBarItem reactive update/keyed order/insertion failed',
	)

	await advance()
	check(
		segmentItemRef.current === first &&
			titles(bar) === 'Same|||Last' &&
			first.props.title === undefined,
		'SegmentedBarItem dropped title default failed',
	)

	await advance()
	check(
		segmentItemRef.current === first && titles(bar) === 'Same|Updated||Last',
		'SegmentedBarItem restored title failed',
	)

	await advance()
	const replacement = segmentItemRef.current
	check(
		replacement !== first &&
			first.parent === null &&
			first.props.title === undefined &&
			segmentItemEvents.join() === 'attach,cleanup,attach',
		'SegmentedBarItem replacement cleanup failed',
	)

	await advance()
	const moved = segmentItemRef.current
	check(
		moved !== replacement &&
			replacement.parent === null &&
			moved.parent.view === debug.findId('item-other') &&
			titles(bar) === 'Same||Last' &&
			titles(debug.findId('item-other')) === 'Updated',
		'SegmentedBarItem authored parent change failed',
	)

	await advance()
	check(
		segmentItemRef.current === null &&
			moved.parent === null &&
			titles(debug.findId('item-other')) === '' &&
			segmentItemEvents.join() === 'attach,cleanup,attach,cleanup,attach,cleanup',
		'SegmentedBarItem removal/ref cleanup failed',
	)

	await advance()
	check(
		Number(bar.segmentCount) === 0 && Number(bar.selectedSegment) === -1 && sibling.parent === null,
		'SegmentedBarItem empty children failed',
	)

	await advance()
	const restored = segmentItemRef.current
	check(restored && titles(bar) === 'Same|Updated||Last', 'SegmentedBarItem reinsertion failed')
	root.unmount()
	await settle()
	check(
		!bar.superview &&
			Number(bar.segmentCount) === 0 &&
			segmentItemRef.current === null &&
			restored.parent === null &&
			restored.props.title === undefined &&
			debug.metrics().nativeViewCount === 0,
		'SegmentedBarItem root teardown failed',
	)

	console.log('PACKED_SEGMENTEDBARITEM_OK')
}
