import Progress, { progressRef, progressRefEvents } from './Progress'

import {
	NSControlSize,
	NSProgressIndicator,
	NSProgressIndicatorStyle,
} from '@octane-xplat/platform/macos'

export async function checkProgressLifecycle(root: any, nativeWindow: any) {
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
		debug.pressId('advance-progress')
		await settle()
	}

	const range = (view: any, value: number, maximum: number) =>
		Number(view.doubleValue) === value &&
		Number(view.maxValue) === maximum &&
		Number(view.minValue) === 0

	root.render(Progress, {})
	await settle()
	const first = progressRef.current,
		left = debug.findId('progress-left'),
		tail = debug.findId('progress-tail')

	check(
		first instanceof NSProgressIndicator &&
			!first.indeterminate &&
			Number(first.style) === Number(NSProgressIndicatorStyle.Bar) &&
			Number(first.controlSize) === Number(NSControlSize.Regular) &&
			first.displayedWhenStopped,
		'Progress default determinate bar styling failed',
	)

	check(
		range(first, 30, 60) && Number(first.alphaValue) === 0.5,
		'Progress mount range/opacity failed',
	)

	const natural = debug.findId('progress-default'),
		rangeControl = debug.findId('progress-range')

	check(range(natural, 0, 100), 'Progress default value/maximum failed')
	check(
		Number(natural.frame.size.width) > 0 && Number(natural.frame.size.height) > 0,
		'Progress unstyled intrinsic layout failed',
	)

	const rect = first.alignmentRectForFrame(first.frame)
	check(
		Math.abs(Number(rect.size.width) - 140) < 1 && Math.abs(Number(rect.size.height) - 16) < 1,
		'Progress explicit layout failed',
	)

	check(
		first.superview === left && Number(first.frame.origin.y) > Number(tail.frame.origin.y),
		'Progress initial nesting/order failed',
	)

	await advance()
	check(
		progressRef.current === first && range(first, 150, 200),
		'Progress reactive range/identity failed',
	)

	await advance()
	check(
		progressRef.current === first && range(first, 0, 100) && Number(first.alphaValue) === 1,
		'Progress dropped value/maximum/style defaults failed',
	)

	await advance()
	check(
		progressRef.current === first &&
			range(first, 50, 50) &&
			Number(first.frame.origin.y) < Number(tail.frame.origin.y),
		'Progress upper clamp/keyed order/identity failed',
	)

	await advance()
	const moved = progressRef.current
	check(
		moved &&
			moved !== first &&
			moved.superview === debug.findId('progress-right') &&
			!first.superview &&
			range(moved, 0, 100),
		'Progress zero maximum/parent change failed',
	)

	check(
		debug.findId('progress-range') === rangeControl && range(rangeControl, 0, 100),
		'Progress retained host zero maximum normalization failed',
	)

	check(
		progressRefEvents.join(',') === 'attach,cleanup,attach',
		'Progress parent ref cleanup failed',
	)

	await advance()
	const returned = progressRef.current
	check(
		returned &&
			returned !== moved &&
			returned.superview === left &&
			!moved.superview &&
			range(returned, 0, 100),
		'Progress negative maximum/return ownership failed',
	)

	check(
		debug.findId('progress-range') === rangeControl && range(rangeControl, 0, 100),
		'Progress retained host negative maximum normalization failed',
	)

	await advance()
	const replacement = progressRef.current
	check(
		replacement &&
			replacement !== returned &&
			replacement.superview === left &&
			!returned.superview &&
			range(replacement, 0, 100),
		'Progress replacement/lower clamp failed',
	)

	await advance()
	check(
		progressRef.current == null &&
			!replacement.superview &&
			progressRefEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'Progress removal/ref cleanup failed',
	)

	await advance()
	const retained = progressRef.current
	check(
		retained && retained.superview === left && range(retained, 12.5, 25),
		'Progress fractional reinsertion failed',
	)

	check(
		debug.findId('progress-range') === rangeControl && range(rangeControl, 12.5, 25),
		'Progress retained host positive range recovery failed',
	)

	root.unmount()
	check(
		progressRef.current == null &&
			!retained.superview &&
			progressRefEvents.join(',') ===
				'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'Progress live ref teardown failed',
	)

	check(
		!tail.superview && !left.superview && !natural.superview && !rangeControl.superview,
		'Progress ancestor teardown retained hosts',
	)

	console.log('PACKED_PROGRESS_OK')
}
