import DatePicker, { dateRef, dateRefEvents, dateChanges } from './Date'

export async function checkDateLifecycle(root: any, nativeWindow: any) {
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
		debug.pressId('advance-date')
		await settle()
	}

	const value = (view: any) => new Date(Number(view.dateValue.timeIntervalSince1970) * 1000)
	const midnight = (date: Date) =>
		date.getHours() === 0 &&
		date.getMinutes() === 0 &&
		date.getSeconds() === 0 &&
		date.getMilliseconds() === 0

	root.render(DatePicker, {})
	await settle()
	const first = dateRef.current,
		left = debug.findId('date-left'),
		tail = debug.findId('date-tail')

	check(
		first instanceof NSDatePicker &&
			Number(first.datePickerElements) === Number(NSDatePickerElementFlags.YearMonthDay) &&
			Number(first.datePickerStyle) === Number(NSDatePickerStyle.TextFieldAndStepper) &&
			first.bezeled &&
			first.drawsBackground,
		'DatePicker native date-only styling failed',
	)

	check(
		value(first).getDate() === 10 && midnight(value(first)),
		'DatePicker date normalization failed',
	)

	check(
		new Date(Number(first.minDate.timeIntervalSince1970) * 1000).getHours() === 0 &&
			new Date(Number(first.maxDate.timeIntervalSince1970) * 1000).getHours() === 0,
		'DatePicker bound normalization failed',
	)

	const idle = debug.findId('idle-default'),
		initial = value(idle).getTime(),
		natural = debug.findId('intrinsic-size')

	check(
		midnight(value(idle)) && idle.minDate == null && idle.maxDate == null,
		'DatePicker defaults failed',
	)

	check(
		value(natural).getFullYear() === 2026 &&
			value(natural).getMonth() === 5 &&
			value(natural).getDate() === 15 &&
			Number(natural.frame.size.width) > 0 &&
			Number(natural.frame.size.height) > 0,
		'DatePicker components/intrinsic layout failed',
	)

	check(
		Number(first.alphaValue) === 0.5 &&
			Math.abs(Number(first.alignmentRectForFrame(first.frame).size.width) - 160) < 1,
		'DatePicker explicit sizing/style failed',
	)

	check(
		first.superview === left && Number(first.frame.origin.y) > Number(tail.frame.origin.y),
		'DatePicker initial nesting/order failed',
	)

	await advance()
	check(
		dateRef.current === first && value(first).getDate() === 12 && !first.enabled,
		'DatePicker reactive date/enabled identity failed',
	)

	check(
		dateChanges.some(
			(event) =>
				event.eventName === 'dateChange' &&
				event.object === first &&
				event.value.getDate() === 12 &&
				event.oldValue.getDate() === 10 &&
				midnight(event.value),
		),
		'DatePicker prop event payload failed',
	)

	await advance()
	check(
		dateRef.current === first &&
			value(first).getTime() === initial &&
			first.minDate == null &&
			first.maxDate == null &&
			first.enabled &&
			Number(first.alphaValue) === 1,
		'DatePicker dropped props did not restore defaults',
	)

	await advance()
	check(
		dateRef.current === first && Number(first.frame.origin.y) < Number(tail.frame.origin.y),
		'DatePicker keyed reorder lost identity/order',
	)

	const count = dateChanges.length
	first.dateValue = NSDate.dateWithTimeIntervalSince1970(
		new Date(2026, 4, 14, 19, 25).getTime() / 1000,
	)

	first.target.controlChanged(first)
	check(
		dateChanges.length === count + 1 &&
			dateChanges.at(-1).value.getDate() === 14 &&
			midnight(dateChanges.at(-1).value) &&
			midnight(value(first)),
		'DatePicker native action normalization/event failed',
	)

	first.target.controlChanged(first)
	check(dateChanges.length === count + 1, 'DatePicker unchanged action emitted duplicate event')
	await advance()
	const moved = dateRef.current
	check(
		moved &&
			moved !== first &&
			moved.superview === debug.findId('date-right') &&
			!first.superview &&
			first.target == null &&
			String(first.action) === '<null selector>',
		'DatePicker parent change ownership failed',
	)

	check(
		dateRefEvents.join(',') === 'attach,cleanup,attach',
		'DatePicker parent change ref cleanup failed',
	)

	await advance()
	const returned = dateRef.current
	check(
		returned &&
			returned !== moved &&
			returned.superview === left &&
			!moved.superview &&
			moved.target == null,
		'DatePicker return failed',
	)

	await advance()
	const replacement = dateRef.current
	check(
		replacement &&
			replacement !== returned &&
			replacement.superview === left &&
			!returned.superview &&
			returned.target == null,
		'DatePicker replacement failed',
	)

	await advance()
	check(
		dateRef.current == null &&
			!replacement.superview &&
			replacement.target == null &&
			dateRefEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'DatePicker removal/ref cleanup failed',
	)

	await advance()
	const retained = dateRef.current
	check(retained && retained.superview === left, 'DatePicker reinsertion failed')
	root.unmount()
	check(
		dateRef.current == null &&
			!retained.superview &&
			retained.target == null &&
			String(retained.action) === '<null selector>' &&
			dateRefEvents.join(',') ===
				'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'DatePicker live ref teardown failed',
	)

	check(!tail.superview && !left.superview, 'DatePicker ancestor teardown failed')
	console.log('PACKED_DATEPICKER_OK')
}
