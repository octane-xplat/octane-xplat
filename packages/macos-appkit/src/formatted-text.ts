/** Viewless text composition. No AppKit object is allocated for a logical node. */
interface TextNode {
	computedStyle?: Record<string, any>
	type: string
	props: Record<string, any>
	text: string
	children: TextNode[]
}

const TEXT_STYLE_KEYS = [
	'fontFamily',
	'fontSize',
	'fontWeight',
	'fontStyle',
	'textDecoration',
	'color',
	'backgroundColor',
	'letterSpacing',
] as const

export function validateTextStyle(props: Record<string, any>, color: (value: any) => any) {
	if (props.style != null && (typeof props.style !== 'object' || Array.isArray(props.style))) {
		throw new Error('AppKit formatted text expects a style object')
	}

	for (const source of [props, props.style ?? {}]) {
		if (source.fontSize != null && (!Number.isFinite(source.fontSize) || source.fontSize <= 0)) {
			throw new Error('AppKit formatted text fontSize must be positive and finite')
		}

		if (source.letterSpacing != null && source.letterSpacing !== 'normal' && !Number.isFinite(source.letterSpacing)) {
			throw new Error('AppKit formatted text letterSpacing must be finite points or normal')
		}

		if (source.fontFamily != null && typeof source.fontFamily !== 'string') {
			throw new Error('AppKit formatted text fontFamily must be a string')
		}

		if (source.fontStyle != null && !['normal', 'italic', 'oblique'].includes(source.fontStyle)) {
			throw new Error('AppKit formatted text fontStyle supports normal, italic and oblique')
		}

		if (
			source.textDecoration != null &&
			![
				'none',
				'underline',
				'line-through',
				'underline line-through',
				'line-through underline',
			].includes(source.textDecoration)
		) {
			throw new Error('AppKit formatted text has an unsupported textDecoration')
		}

		for (const key of ['color', 'backgroundColor']) {
			if (source[key] != null) {
				color(source[key])
			}
		}
	}
}

/** Fold inherited values without mutating authored props. Removed values fall
 * through to the ancestor; style wins over the direct property. */
export function textRuns(
	node: TextNode,
	inherited: Record<string, any> = {},
): Array<{ text: string; style: Record<string, any> }> {
	const style = { ...inherited }
	for (const key of TEXT_STYLE_KEYS) {
		const value = node.computedStyle?.[key] ?? node.props.style?.[key] ?? node.props[key]
		if (value != null) {
			style[key] = value
		}
	}

	const own =
		node.type === '#text'
			? node.text
			: node.type === 'span'
				? String(node.props.text ?? '')
						.replace('\\n', '\n')
						.replace('\\t', '\t')
				: ''

	return [
		...(own ? [{ text: own, style }] : []),
		...node.children.flatMap((child) => textRuns(child, style)),
	]
}

export function composeAttributedText(
	children: TextNode[],
	view: any,
	props: Record<string, any>,
	font: (size: number, weight: number | string, family?: string) => any,
	color: (value: any) => any,
	defaults: Record<string, any>,
) {
	const native = globalThis as any
	const result = native.NSMutableAttributedString.alloc().initWithString('')
	const paragraph = native.NSMutableParagraphStyle.alloc().init()
	paragraph.alignment = view.alignment ?? 0
	paragraph.lineBreakMode = view.cell?.lineBreakMode ?? native.NSLineBreakMode.WordWrapping
	const lineHeight = Number(defaults.lineHeight ?? props.style?.lineHeight)
	if (Number.isFinite(lineHeight) && lineHeight > 0) {
		paragraph.minimumLineHeight = lineHeight
		paragraph.maximumLineHeight = lineHeight
	}

	for (const run of children.flatMap((child) => textRuns(child, defaults))) {
		const style = run.style
		let face = font(style.fontSize, style.fontWeight, style.fontFamily)
		if (style.fontStyle === 'italic' || style.fontStyle === 'oblique') {
			face = native.NSFontManager.sharedFontManager.convertFontToHaveTrait(
				face,
				native.NSFontTraitMask.Italic,
			)
		}

		const attributes: Record<string, any> = {
			[native.NSFontAttributeName]: face,
			[native.NSParagraphStyleAttributeName]: paragraph,
		}

		if (style.color != null) {
			attributes[native.NSForegroundColorAttributeName] =
				typeof style.color === 'object' ? style.color : color(style.color)
		}

		if (style.backgroundColor != null) {
			attributes[native.NSBackgroundColorAttributeName] =
				typeof style.backgroundColor === 'object'
					? style.backgroundColor
					: color(style.backgroundColor)
		}

		if (String(style.textDecoration).includes('underline')) {
			attributes[native.NSUnderlineStyleAttributeName] = 1
		}

		if (String(style.textDecoration).includes('line-through')) {
			attributes[native.NSStrikethroughStyleAttributeName] = 1
		}

		const kern = Number(style.letterSpacing)
		// Match plain labels: zero/normal reset inherited spacing by omitting
		// an explicit kern attribute on this newly constructed run.
		if (Number.isFinite(kern) && kern !== 0) {attributes[native.NSKernAttributeName] = kern}

		result.appendAttributedString(
			native.NSAttributedString.alloc().initWithStringAttributes(run.text, attributes),
		)
	}

	return result
}
