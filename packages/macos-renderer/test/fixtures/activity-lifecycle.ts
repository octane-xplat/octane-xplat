import Activity, { activityRef, activityRefEvents } from './Activity'

export async function checkActivityLifecycle(root: any, nativeWindow: any) {
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
		debug.pressId('advance-activity')
		await settle()
	}

	root.render(Activity, {})
	await settle()
	const first = activityRef.current,
		left = debug.findId('activity-left'),
		tail = debug.findId('activity-tail')

	check(
		first instanceof NSProgressIndicator && first.indeterminate &&
		Number(first.style) === Number(NSProgressIndicatorStyle.Spinning) &&
		Number(first.controlSize) === Number(NSControlSize.Regular) &&
		!first.displayedWhenStopped && !(Number(first.alphaValue) === 0),
		'ActivityIndicator default spinner styling/busy mount failed',
	)

	const idle = debug.findId('idle-default'), natural = debug.findId('intrinsic-size')
	check((Number(idle.alphaValue) === 0) && !idle.displayedWhenStopped, 'Unspecified busy default failed')
	check(Number(natural.frame.size.width) > 0 && Number(natural.frame.size.height) > 0,
		'Unstyled spinner has no intrinsic layout size')

	check(Number(first.alphaValue) === 0.5, 'ActivityIndicator opacity style failed')
	const rect = first.alignmentRectForFrame(first.frame)
	check(
		Math.abs(Number(rect.size.width) - 32) < 1 && Math.abs(Number(rect.size.height) - 32) < 1,
		'ActivityIndicator layout size failed',
	)

	check(
		first.superview === left && Number(first.frame.origin.y) > Number(tail.frame.origin.y),
		'Initial ActivityIndicator order/nesting failed',
	)

	const initialTailY = Number(tail.frame.origin.y)
	await advance()
	check(Number(tail.frame.origin.y) === initialTailY, 'Stopped spinner collapsed its layout slot')
	check(activityRef.current === first && (Number(first.alphaValue) === 0),
		'ActivityIndicator reactive busy=false/identity failed')

	await advance()
	check(activityRef.current === first && (Number(first.alphaValue) === 0),
		'Dropped busy did not restore stopped default')

	check(Number(first.alphaValue) === 0, 'Dropped busy/style did not leave the default spinner stopped')
	await advance()
	check(activityRef.current === first && !(Number(first.alphaValue) === 0) &&
		Number(first.frame.origin.y) < Number(tail.frame.origin.y),
		'Keyed indicator reorder/busy restart lost native identity/order')

	check(Number(first.alphaValue) === 1, 'Restart retained removed opacity style')

	await advance()
	const moved = activityRef.current
	check(
		moved && moved !== first && moved.superview === debug.findId('activity-right') && !first.superview && (Number(first.alphaValue) === 0),
		'ActivityIndicator parent change ownership failed',
	)

	check(
		activityRefEvents.join(',') === 'attach,cleanup,attach',
		'ActivityIndicator parent change ref cleanup failed',
	)

	await advance()
	const returned = activityRef.current
	check(
		returned && returned !== moved && returned.superview === left && !moved.superview && moved.hidden,
		'ActivityIndicator return to original parent failed',
	)

	await advance()
	const replacement = activityRef.current
	check(
		replacement &&
			replacement !== returned &&
			replacement.superview === left &&
			!returned.superview && returned.hidden,
		'ActivityIndicator replacement failed',
	)

	await advance()
	check(
		activityRef.current == null &&
			!replacement.superview && replacement.hidden &&
			activityRefEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'ActivityIndicator removal/ref cleanup failed',
	)

	await advance()
	const retained = activityRef.current
	check(retained && retained.superview === left, 'ActivityIndicator reinsertion failed')
	root.unmount()
	check(
		activityRef.current == null &&
			!retained.superview && retained.hidden &&
			activityRefEvents.join(',') ===
				'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'ActivityIndicator live ref teardown failed',
	)

	check(!tail.superview && !left.superview, 'ActivityIndicator ancestor teardown retained native hosts')
	console.log('PACKED_ACTIVITYINDICATOR_OK')
}
