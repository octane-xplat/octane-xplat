import ActionBar, { barRef, barEvents, externalTitle } from './ActionBar'
import { NSView } from '@octane-xplat/platform/macos'

export async function checkActionBarLifecycle(root: any, window: any) {
	const debug = root.__macosDebug
	let assertions = 0
	const check = (value: any, message: string) => {
		assertions++
		if (!value) {
			throw new Error('ActionBar: ' + message)
		}
	}

	const settle = () =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				window.contentView.layoutSubtreeIfNeeded()
				resolve()
			}, 80),
		)

	const advance = async () => {
		debug.pressId('advance-bar')
		await settle()
	}

	const title = (host: any) => host.subviews.objectAtIndex(0)
	root.render(ActionBar, {})
	await settle()
	const natural = debug.findId('bar-natural')
	check(
		Number(natural.intrinsicContentSize.width) === 80 &&
			Number(natural.intrinsicContentSize.height) === 44,
		'natural titleView sizing',
	)

	const first = barRef.current
	check(first instanceof NSView && debug.findId('bar') === first, 'host/ref')
	check(
		first.subviews.count === 1 && String(title(first).stringValue) === 'Initial',
		'title fallback',
	)

	check(Number(first.frame.size.width) === 240 && Number(first.frame.size.height) === 44, 'layout')
	check(Number(first.layer.shadowOpacity) > 0, 'default shadow')
	await advance()
	check(
		barRef.current === first && String(title(first).stringValue) === 'Updated',
		'reactive title/identity',
	)

	check(
		Number(first.layer.shadowOpacity) === 0 && Number(first.frame.size.width) === 300,
		'flat/resize',
	)

	await advance()
	const child = debug.findId('bar-child')
	check(child.superview === first && first.subviews.count === 1, 'JSX title slot replacement')
	const rect = child.alignmentRectForFrame(child.frame)
	check(
		Math.abs(Number(rect.origin.x) - 90) < 1 && Math.abs(Number(rect.origin.y) - 12) < 1,
		'center/middle defaults',
	)

	check(Number(first.layer.shadowOpacity) > 0, 'flat removal')
	await advance()
	check(
		!child.superview && externalTitle.superview === first && first.subviews.count === 1,
		'external titleView',
	)

	await advance()
	check(
		!externalTitle.superview && String(title(first).stringValue) === '',
		'prop removal restores empty title',
	)

	await advance()
	const replacement = barRef.current
	check(
		replacement !== first && !first.superview && first.subviews.count === 0,
		'key replacement/disposal',
	)

	await advance()
	check(
		barRef.current == null && !replacement.superview && replacement.subviews.count === 0,
		'removal/cleanup',
	)

	await advance()
	const reinserted = barRef.current
	check(
		reinserted && reinserted !== replacement && String(title(reinserted).stringValue) === 'Updated',
		'reinsertion',
	)

	root.unmount()
	check(
		barRef.current == null && !reinserted.superview && reinserted.subviews.count === 0,
		'teardown',
	)

	check(
		barEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup',
		'array/object/callback refs',
	)

	console.log('PACKED_ACTIONBAR_OK assertions=' + assertions)
}
