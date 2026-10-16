import Placeholder, {
	assignedViews,
	creatingViewEvents,
	placeholderRef,
	placeholderRefEvents,
} from './Placeholder'

import { NSTextField, NSView } from '@octane-xplat/platform/macos'

export async function checkPlaceholderLifecycle(root: any, nativeWindow: any) {
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
		debug.pressId('advance-ph')
		await settle()
	}

	const rect = (view: any) => view.alignmentRectForFrame(view.frame)
	const near = (a: number, b: number) => Math.abs(a - b) < 1
	const pinned = (view: any, host: any) =>
		near(Number(rect(view).origin.x), 0) &&
		near(Number(rect(view).origin.y), 0) &&
		near(Number(rect(view).size.width), Number(host.bounds.size.width)) &&
		near(Number(rect(view).size.height), Number(host.bounds.size.height))

	root.render(Placeholder, {})
	await settle()
	const first = placeholderRef.current,
		left = debug.findId('ph-left'),
		tail = debug.findId('ph-tail')

	check(
		first instanceof NSView && debug.findId('ph') === first,
		'Placeholder mount host/ref failed',
	)

	check(
		creatingViewEvents.length === 1 &&
			creatingViewEvents[0].eventName === 'creatingView' &&
			creatingViewEvents[0].object === first,
		'creatingView single-fire payload failed',
	)

	const assigned = assignedViews[0]
	check(assigned instanceof NSTextField, 'Assigned view is not an NSTextField')
	check(
		assigned.superview === first && Number(first.subviews.count) === 1,
		"Assigned view did not attach as the host's only subview",
	)

	check(
		pinned(assigned, first),
		'Assigned view pinning inside the host failed: ' +
			[
				rect(assigned).origin.x,
				rect(assigned).origin.y,
				rect(assigned).size.width,
				rect(assigned).size.height,
			].join(',') +
			' host=' +
			[0, 0, first.bounds.size.width, first.bounds.size.height].join(','),
	)

	check(
		Number(first.frame.size.width) === 160 &&
			Number(first.frame.origin.y) > Number(tail.frame.origin.y),
		'Placeholder explicit size and child order failed',
	)

	const empty = debug.findId('ph-empty')
	check(
		empty instanceof NSView && Number(empty.subviews.count) === 0,
		'Empty placeholder without a handler failed',
	)

	await advance()
	check(
		placeholderRef.current === first &&
			Number(first.alphaValue) === 0.5 &&
			creatingViewEvents.length === 1,
		'Placeholder style update lost host or refired',
	)

	await advance()
	check(
		placeholderRef.current === first &&
			assigned.superview === first &&
			creatingViewEvents.length === 1 &&
			Number(first.frame.origin.y) < Number(tail.frame.origin.y),
		'Keyed reorder lost placeholder identity, content, or order',
	)

	await advance()
	const moved = placeholderRef.current
	check(
		moved &&
			moved !== first &&
			moved.superview === debug.findId('ph-right') &&
			!first.superview &&
			creatingViewEvents.length === 2 &&
			assignedViews[1].superview === moved &&
			pinned(assignedViews[1], moved),
		'Placeholder parent change refire/rehoming failed',
	)

	await advance()
	const returned = placeholderRef.current
	check(
		returned &&
			returned !== moved &&
			returned.superview === left &&
			!moved.superview &&
			creatingViewEvents.length === 3 &&
			assignedViews[2].superview === returned,
		'Placeholder return to original parent failed',
	)

	await advance()
	const replacement = placeholderRef.current
	check(
		replacement &&
			replacement !== returned &&
			replacement.superview === left &&
			!returned.superview &&
			creatingViewEvents.length === 4 &&
			assignedViews[3].superview === replacement,
		'Placeholder keyed replacement/refire failed',
	)

	await advance()
	check(
		placeholderRef.current == null &&
			!replacement.superview &&
			creatingViewEvents.length === 4 &&
			placeholderRefEvents.join(',') ===
				'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'Placeholder removal/ref cleanup failed',
	)

	await advance()
	const reinserted = placeholderRef.current
	check(
		reinserted &&
			reinserted !== replacement &&
			reinserted.superview === left &&
			creatingViewEvents.length === 5 &&
			assignedViews[4].superview === reinserted,
		'Placeholder reinsertion/refire failed',
	)

	root.unmount()
	check(
		placeholderRef.current == null &&
			!reinserted.superview &&
			placeholderRefEvents.join(',') ===
				'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'Placeholder live ref teardown failed',
	)

	check(
		!tail.superview && !left.superview && !assigned.superview,
		'Placeholder teardown retained native hosts',
	)

	console.log('PACKED_PLACEHOLDER_OK')
}
