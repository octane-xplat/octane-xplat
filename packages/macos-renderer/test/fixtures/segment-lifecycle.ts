import {
	NSControlSize,
	NSSegmentedControl,
	NSSegmentSwitchTracking,
} from '@octane-xplat/platform/macos'

import SegmentedBar, { segmentRef, segmentRefEvents, segmentChanges } from './Segment'

export async function checkSegmentLifecycle(root: any, nativeWindow: any) {
	const debug = root.__macosDebug
	const check = (value: boolean, message: string) => {
		if (!value) {
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
		debug.pressId('advance-segment')
		await settle()
	}

	const index = (view: any) => Number(view.selectedSegment)
	const count = (view: any) => Number(view.segmentCount)
	const titles = (view: any) =>
		Array.from({ length: count(view) }, (_, i) => String(view.labelForSegment(i))).join('|')

	const disposed = (view: any) =>
		!view.superview &&
		view.target == null &&
		String(view.action) === '<null selector>' &&
		count(view) === 0

	root.render(SegmentedBar, {})
	await settle()
	const first = segmentRef.current,
		left = debug.findId('segment-left'),
		tail = debug.findId('segment-tail')

	check(
		first instanceof NSSegmentedControl &&
			Number(first.trackingMode) === Number(NSSegmentSwitchTracking.SelectOne) &&
			Number(first.controlSize) === Number(NSControlSize.Regular),
		'SegmentedBar native default styling failed',
	)

	check(
		titles(first) === 'Same|Same||Last|' && index(first) === 1,
		'SegmentedBar duplicate/missing/empty titles or initial index failed',
	)

	check(
		Number(first.selectedSegmentBezelColor.redComponent) === 1,
		'SegmentedBar initial tint failed',
	)

	const idle = debug.findId('segment-default'),
		natural = debug.findId('segment-natural')

	check(
		count(idle) === 0 && index(idle) === -1 && count(natural) === 1 && index(natural) === 0,
		'SegmentedBar empty/default index failed',
	)

	check(
		Number(natural.frame.size.width) > 0 && Number(natural.frame.size.height) > 0,
		'SegmentedBar intrinsic layout failed',
	)

	check(
		Number(first.alphaValue) === 0.5 &&
			Math.abs(Number(first.alignmentRectForFrame(first.frame).size.width) - 160) < 1,
		'SegmentedBar explicit layout/style failed',
	)

	check(
		first.superview === left && Number(first.frame.origin.y) > Number(tail.frame.origin.y),
		'SegmentedBar initial nesting/order failed',
	)

	await advance()
	check(
		segmentRef.current === first && titles(first) === 'New|Next|Last' && index(first) === 2,
		'SegmentedBar reactive items/index identity failed',
	)

	check(
		segmentChanges.some(
			(event) =>
				event.eventName === 'selectedIndexChange' &&
				event.object === first &&
				event.value === 2 &&
				event.oldIndex === 1 &&
				event.newIndex === 2,
		),
		'SegmentedBar prop event payload failed',
	)

	check(
		Number(first.selectedSegmentBezelColor.greenComponent) === 1,
		'SegmentedBar reactive tint failed',
	)

	const before = segmentChanges.length
	first.selectedSegment = 0
	first.target.controlChanged(first)
	check(
		segmentChanges.length === before + 1 &&
			segmentChanges.at(-1).value === 0 &&
			segmentChanges.at(-1).oldIndex === 2 &&
			segmentChanges.at(-1).object === first,
		'SegmentedBar native event payload failed',
	)

	first.target.controlChanged(first)
	check(segmentChanges.length === before + 1, 'SegmentedBar unchanged action emitted an event')
	await advance()
	check(
		segmentRef.current === first &&
			count(first) === 0 &&
			index(first) === -1 &&
			Number(first.alphaValue) === 1,
		'SegmentedBar dropped props/style defaults failed',
	)

	check(
		Number(first.selectedSegmentBezelColor.blueComponent) === 1,
		'SegmentedBar dropped tint did not restore blue',
	)

	await advance()
	check(
		segmentRef.current === first &&
			index(first) === 2 &&
			Number(first.frame.origin.y) < Number(tail.frame.origin.y),
		'SegmentedBar keyed move lost identity/order',
	)

	await advance()
	const moved = segmentRef.current
	check(
		moved &&
			moved !== first &&
			moved.superview === debug.findId('segment-right') &&
			index(moved) === 0 &&
			disposed(first),
		'SegmentedBar parent change ownership failed',
	)

	check(
		segmentRefEvents.join(',') === 'attach,cleanup,attach',
		'SegmentedBar parent change ref cleanup failed',
	)

	await advance()
	const returned = segmentRef.current
	check(
		returned && returned !== moved && returned.superview === left && disposed(moved),
		'SegmentedBar return failed',
	)

	await advance()
	const replacement = segmentRef.current
	check(
		replacement && replacement !== returned && replacement.superview === left && disposed(returned),
		'SegmentedBar replacement failed',
	)

	await advance()
	check(
		segmentRef.current == null &&
			disposed(replacement) &&
			segmentRefEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'SegmentedBar removal/ref cleanup failed',
	)

	await advance()
	const retained = segmentRef.current
	check(retained && retained.superview === left, 'SegmentedBar reinsertion failed')
	root.unmount()
	check(
		segmentRef.current == null &&
			disposed(retained) &&
			segmentRefEvents.join(',') ===
				'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'SegmentedBar live ref teardown failed',
	)

	check(!tail.superview && !left.superview, 'SegmentedBar ancestor teardown failed')
	console.log('PACKED_SEGMENTEDBAR_OK')
}
