import Formatted, { formattedRef, spanRef, formattedRefEvents } from './Formatted'

import { NSBackgroundColorAttributeName, NSFontAttributeName, NSFontTraitMask, NSForegroundColorAttributeName, NSStrikethroughStyleAttributeName, NSUnderlineStyleAttributeName } from '@octane-xplat/platform/macos'

export async function checkFormattedLifecycle(root: any, nativeWindow: any) {
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
			}, 60),
		)

	const advance = async () => {
		debug.pressId('advance-formatted')
		await settle()
	}

	const attribute = (view: any, name: any, at = 0) =>
		view.attributedStringValue.attributeAtIndexEffectiveRange(name, at, null)

	root.render(Formatted, {})
	await settle()
	const parent = debug.findId('formatted-parent'),
		logical = formattedRef.current,
		span = spanRef.current

	check(
		logical && logical.view === null && logical.type === 'formattedstring',
		'FormattedString logical ref missing',
	)

	check(span && span.view === null && span.type === 'span', 'Span logical ref missing')
	check(String(parent.stringValue) === 'AnB', 'Nested span composition failed')
	const frame = parent.alignmentRectForFrame(parent.frame)
	check(
		Math.abs(Number(frame.size.width) - 240) < 1 && Math.abs(Number(frame.size.height) - 28) < 1,
		'Formatted parent layout failed: ' + JSON.stringify(parent.frame),
	)

	check(
		Number(attribute(parent, NSFontAttributeName).pointSize) === 20,
		'Formatted inherited fontSize failed',
	)

	check(
		Number(attribute(parent, NSFontAttributeName, 1).pointSize) === 12,
		'Nested style override failed',
	)

	check(
		Number(attribute(parent, NSForegroundColorAttributeName, 1).blueComponent) === 1,
		'Nested color override failed',
	)

	check(
		Number(attribute(parent, NSBackgroundColorAttributeName).redComponent) === 1,
		'Inherited background failed',
	)

	check(
		Number(attribute(parent, NSUnderlineStyleAttributeName)) === 1 &&
			Number(attribute(parent, NSStrikethroughStyleAttributeName)) === 1,
		'Decoration failed',
	)

	check(
		(Number(attribute(parent, NSFontAttributeName).fontDescriptor.symbolicTraits) &
			NSFontTraitMask.Italic) !==
			0,
		'Italic failed',
	)

	check(
		String(debug.findId('formatted-button').attributedTitle.string) === 'Button',
		'Button formatted title failed',
	)

	check(
		String(debug.findId('formatted-field').stringValue) === 'Field',
		'TextField formatted text failed',
	)

	check(
		String(debug.findId('formatted-view').textStorage.string) === 'View',
		'TextView formatted text failed',
	)

	check(
		String(debug.findId('formatted-search').stringValue) === 'Search',
		'SearchBar formatted text failed',
	)

	await advance()
	for (const id of ['button', 'field', 'view', 'search']) {
		const host = debug.findId('formatted-' + id)
		const value = id === 'button' ? host.attributedTitle : id === 'view' ? host.textStorage : host.attributedStringValue
		check(String(value.string).startsWith('Updated '), id + ' formatted update failed')
		check(Number(value.attributeAtIndexEffectiveRange(NSFontAttributeName, 0, null).pointSize) === 24, id + ' font update failed')
	}

	check(
		formattedRef.current === logical &&
			spanRef.current === span &&
			String(parent.stringValue) === 'UpdatednB',
		'Reactive update lost text/ref identity',
	)

	check(
		Number(attribute(parent, NSFontAttributeName).pointSize) === 24,
		'Reactive inherited style failed',
	)

	await advance()
	for (const id of ['button', 'field', 'view', 'search']) {
		const host = debug.findId('formatted-' + id)
		const value = id === 'button' ? host.attributedTitle : id === 'view' ? host.textStorage : host.attributedStringValue
		check(Number(value.attributeAtIndexEffectiveRange(NSFontAttributeName, 0, null).pointSize) === Number(host.font?.pointSize ?? 14), id + ' default restoration failed')
	}

	check(
		Number(attribute(parent, NSFontAttributeName).pointSize) === 16 &&
			Number(attribute(parent, NSFontAttributeName, 1).pointSize) === 16,
		'Dropped font override did not restore parent default',
	)

	check(
		attribute(parent, NSBackgroundColorAttributeName) == null &&
			attribute(parent, NSUnderlineStyleAttributeName) == null &&
			attribute(parent, NSStrikethroughStyleAttributeName) == null,
		'Dropped styling retained attributes',
	)

	await advance()
	check(
		String(parent.stringValue) === 'BAn' && spanRef.current === span,
		'Keyed span ordering lost identity',
	)

	await advance()
	check(
		String(parent.stringValue) === 'B' && spanRef.current == null && span.parent == null,
		'Removed span cleanup failed',
	)

	await advance()
	check(
		String(parent.stringValue) === '' &&
			formattedRef.current === logical &&
			logical.children.length === 0,
		'Empty FormattedString retained text or lost ref',
	)

	await advance()
	for (const id of ['button', 'field', 'view', 'search']) {
		const host = debug.findId('formatted-' + id)
		const value = id === 'button' ? host.title : id === 'view' ? host.string : host.stringValue
		check(String(value).startsWith('Plain '), id + ' removal fallback failed')
	}

	check(
		String(parent.stringValue) === 'fallback' &&
			formattedRef.current == null &&
			logical.parent == null &&
			formattedRefEvents.join(',') === 'attach,cleanup',
		'Removed FormattedString did not restore parent or clear refs',
	)

	await advance()
	const recreated = formattedRef.current
	check(recreated !== logical && String(parent.stringValue) === 'BAn', 'Reinsertion failed')
	await advance()
	check(
		formattedRef.current !== recreated &&
			recreated.children.length === 0 &&
			recreated.parent == null,
		'Replacement retained logical ownership',
	)

	const replacement = formattedRef.current
	await advance()
	check(
		String(parent.stringValue) === 'fallback' &&
			String(debug.findId('formatted-other').attributedTitle.string) === 'BAn' &&
			formattedRef.current !== replacement &&
			replacement.parent == null,
		'Parent change retained old text or logical ref',
	)

	const moving = formattedRef.current,
		remainingSpan = spanRef.current

	root.unmount()
	check(
		formattedRef.current == null &&
			spanRef.current == null &&
			moving.parent == null &&
			moving.children.length === 0 &&
			remainingSpan.parent == null,
		'Teardown leaked text ownership/refs',
	)

	const count = formattedRefEvents.length
	root.unmount()
	check(formattedRefEvents.length === count, 'Repeated teardown repeated cleanup')
	console.log('PACKED_FORMATTEDSTRING_OK')
}
