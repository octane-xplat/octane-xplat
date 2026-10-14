import TimePicker, { timeRef, timeRefEvents, timeChanges } from './Time'

export async function checkTimeLifecycle(root: any, nativeWindow: any) {
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
		debug.pressId('advance-time')
		await settle()
	}

	const value = (view: any) => new Date(Number(view.dateValue.timeIntervalSince1970) * 1000)
	const normalized = (time: Date) => time.getTime() === new Date(0, 0, 0, time.getHours(), time.getMinutes()).getTime()
	const minutes = (time: Date) => time.getHours() * 60 + time.getMinutes()
	const bound = (view: any, key: string) => minutes(new Date(Number(view[key].timeIntervalSince1970) * 1000))
	root.render(TimePicker, {})
	await settle()
	const first = timeRef.current, left = debug.findId('time-left'), tail = debug.findId('time-tail')
	check(first instanceof NSDatePicker && first.bezeled && first.drawsBackground, 'TimePicker native chrome failed')
	check(timeRef.current === first && minutes(value(first)) === 625 && normalized(value(first)), 'TimePicker initial time/ref failed')
	check(Number(first.datePickerElements) === Number(NSDatePickerElementFlags.HourMinute), 'TimePicker mode failed')
	const range = debug.findId('range-check')
	check(minutes(value(range)) === 555 && bound(range, 'minDate') === 555 && bound(range, 'maxDate') === 1065, 'TimePicker initial lower clamp failed')
	check(bound(first, 'minDate') === 490 && bound(first, 'maxDate') === 1250, 'TimePicker initial bounds failed')
	const idle = debug.findId('idle-default'), initial = value(idle).getTime(), natural = debug.findId('intrinsic-size')
	check(normalized(value(idle)) && bound(idle, 'minDate') === 0 && bound(idle, 'maxDate') === 1439, 'TimePicker defaults failed')
	check(minutes(value(natural)) === 375 && Number(natural.frame.size.width) > 0 && Number(natural.frame.size.height) > 0, 'TimePicker components/intrinsic layout failed')

	check(
		Number(first.alphaValue) === 0.5 &&
			Math.abs(Number(first.alignmentRectForFrame(first.frame).size.width) - 160) < 1,
		'TimePicker explicit sizing/style failed',
	)

	check(
		first.superview === left && Number(first.frame.origin.y) > Number(tail.frame.origin.y),
		'TimePicker initial nesting/order failed',
	)

	await advance()
	check(
		timeRef.current === first && minutes(value(first)) === 755 && !first.enabled,
		'TimePicker reactive time/enabled identity failed',
	)

	check(minutes(value(range)) === 1065 && bound(range, 'minDate') === 555 && bound(range, 'maxDate') === 1065, 'TimePicker inverted range must preserve both endpoints and clamp to old maximum')
	check(bound(first, 'minDate') === 560 && bound(first, 'maxDate') === 1120, 'TimePicker reactive bound updates failed')

	check(
		timeChanges.some(
			(event) =>
				event.eventName === 'timeChange' &&
				event.object === first &&
				minutes(event.value) === 755 &&
				minutes(event.oldValue) === 625 &&
				normalized(event.value),
		),
		'TimePicker prop event payload failed',
	)

	await advance()
	check(
		timeRef.current === first &&
			value(first).getTime() === initial &&
			bound(first, 'minDate') === 0 &&
			bound(first, 'maxDate') === 1439 &&
			first.enabled &&
			Number(first.alphaValue) === 1,
		'TimePicker dropped props did not restore defaults',
	)

	await advance()
	check(
		timeRef.current === first && Number(first.frame.origin.y) < Number(tail.frame.origin.y),
		'TimePicker keyed reorder lost identity/order',
	)

	const count = timeChanges.length
	first.dateValue = NSDate.dateWithTimeIntervalSince1970(
		new Date(0, 0, 0, 14, 25, 42).getTime() / 1000,
	)

	first.target.controlChanged(first)
	check(
		timeChanges.length === count + 1 &&
			minutes(timeChanges.at(-1).value) === 865 &&
			normalized(timeChanges.at(-1).value) &&
			normalized(value(first)),
		'TimePicker native action normalization/event failed',
	)

	first.target.controlChanged(first)
	check(timeChanges.length === count + 1, 'TimePicker unchanged action emitted duplicate event')
	await advance()
	const moved = timeRef.current
	check(
		moved &&
			moved !== first &&
			moved.superview === debug.findId('time-right') &&
			!first.superview &&
			first.target == null &&
			String(first.action) === '<null selector>',
		'TimePicker parent change ownership failed',
	)

	check(
		timeRefEvents.join(',') === 'attach,cleanup,attach',
		'TimePicker parent change ref cleanup failed',
	)

	await advance()
	const returned = timeRef.current
	check(
		returned &&
			returned !== moved &&
			returned.superview === left &&
			!moved.superview &&
			moved.target == null,
		'TimePicker return failed',
	)

	await advance()
	const replacement = timeRef.current
	check(
		replacement &&
			replacement !== returned &&
			replacement.superview === left &&
			!returned.superview &&
			returned.target == null,
		'TimePicker replacement failed',
	)

	await advance()
	check(
		timeRef.current == null &&
			!replacement.superview &&
			replacement.target == null &&
			timeRefEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'TimePicker removal/ref cleanup failed',
	)

	await advance()
	const retained = timeRef.current
	check(retained && retained.superview === left, 'TimePicker reinsertion failed')
	root.unmount()
	check(
		timeRef.current == null &&
			!retained.superview &&
			retained.target == null &&
			String(retained.action) === '<null selector>' &&
			timeRefEvents.join(',') ===
				'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'TimePicker live ref teardown failed',
	)

	check(!tail.superview && !left.superview, 'TimePicker ancestor teardown failed')
	console.log('PACKED_TIMEPICKER_OK')
}
