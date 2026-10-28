import Html, { htmlRef, htmlRefEvents } from './Html'

import {
	NSColor,
	NSColorSpace,
	NSFontAttributeName,
	NSFontTraitMask,
	NSForegroundColorAttributeName,
	NSLinkAttributeName,
} from '@octane-xplat/platform/macos'

export async function checkHtmlLifecycle(root: any, nativeWindow: any) {
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
		debug.pressId('advance-html')
		await settle()
	}

	const attr = (view: any, name: string, at = 0) =>
		view.attributedStringValue.attributeAtIndexEffectiveRange(name, at, null)

	root.render(Html, {})
	await settle()
	const first = htmlRef.current,
		left = debug.findId('html-left'),
		tail = debug.findId('html-tail')

	check(
		first && !first.editable && first.selectable && !first.drawsBackground,
		'HtmlView default host styling failed',
	)

	check(
		String(first.stringValue).trim() === 'Hello & link',
		'HTML markup/entity/link parsing failed: ' + first.stringValue,
	)

	check(
		Number(attr(first, NSFontAttributeName).pointSize) === 20,
		'HTML default body font size failed',
	)

	check(
		(Number(attr(first, NSFontAttributeName).fontDescriptor.symbolicTraits) &
			NSFontTraitMask.Bold) !==
			0,
		'HTML bold markup lost',
	)

	check(
		Number(attr(first, NSForegroundColorAttributeName).redComponent) === 1,
		'HTML body color failed',
	)

	check(attr(first, NSLinkAttributeName, 8) != null, 'HTML link attribute missing')
	const rect = first.alignmentRectForFrame(first.frame)
	check(
		Math.abs(Number(rect.size.width) - 200) < 1 && Math.abs(Number(rect.size.height) - 40) < 1,
		'HtmlView layout size failed',
	)

	check(
		first.superview === left && Number(first.frame.origin.y) > Number(tail.frame.origin.y),
		'Initial HTML order/nesting failed',
	)

	await advance()
	check(
		htmlRef.current === first && String(first.stringValue).trim() === 'Updated & 世界',
		'HTML reactive UTF8 update/identity failed: ' +
			JSON.stringify({ identity: htmlRef.current === first, text: String(first.stringValue) }),
	)

	check(
		Number(attr(first, NSFontAttributeName).pointSize) === 24 &&
			(Number(attr(first, NSFontAttributeName).fontDescriptor.symbolicTraits) &
				NSFontTraitMask.Italic) !==
				0,
		'HTML reactive font/italic failed',
	)

	await advance()
	check(
		htmlRef.current === first && String(first.stringValue) === '',
		'Dropped HTML did not restore empty default',
	)

	const srgb = (color: any) => {
		const rgb = color.colorUsingColorSpace(NSColorSpace.sRGBColorSpace)
		return [rgb.redComponent, rgb.greenComponent, rgb.blueComponent, rgb.alphaComponent]
			.map((component: any) => Math.round(Number(component) * 255))
			.join(',')
	}
	check(
		Number(first.font.pointSize) === 16 && srgb(first.textColor) === srgb(NSColor.labelColor),
		'Dropped HTML style did not restore host defaults',
	)

	await advance()
	check(
		htmlRef.current === first && Number(first.frame.origin.y) < Number(tail.frame.origin.y),
		'Keyed HTML reorder lost native identity/order',
	)

	check(
		Number(attr(first, NSFontAttributeName).pointSize) === 16,
		'Reparsed HTML retained removed font override',
	)

	await advance()
	const moved = htmlRef.current
	check(
		moved && moved !== first && moved.superview === debug.findId('html-right') && !first.superview,
		'HTML parent change ownership failed',
	)

	check(
		htmlRefEvents.join(',') === 'attach,cleanup,attach',
		'HTML parent change ref cleanup failed',
	)

	await advance()
	const returned = htmlRef.current
	check(
		returned && returned !== moved && returned.superview === left && !moved.superview,
		'HTML return to original parent failed',
	)

	await advance()
	const replacement = htmlRef.current
	check(
		replacement &&
			replacement !== returned &&
			replacement.superview === left &&
			!returned.superview,
		'HTML replacement failed',
	)

	await advance()
	check(
		htmlRef.current == null &&
			!replacement.superview &&
			htmlRefEvents.join(',') === 'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'HTML removal/ref cleanup failed',
	)

	await advance()
	const retained = htmlRef.current
	check(retained && retained.superview === left, 'HTML reinsertion failed')
	root.unmount()
	check(
		htmlRef.current == null &&
			!retained.superview &&
			htmlRefEvents.join(',') ===
				'attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup,attach,cleanup',
		'HTML live ref teardown failed',
	)

	check(!tail.superview && !left.superview, 'HTML ancestor teardown retained native hosts')
	console.log('PACKED_HTMLVIEW_OK')
}
