/** AppKit's HTML importer owns markup semantics; this layer supplies host styling. */
import { srgbComponents } from './color-components.ts'

export function validateHtmlProps(props: Record<string, any>) {
	if (props.html != null && typeof props.html !== 'string') {
		throw new Error('AppKit htmlview html must be a string')
	}
}

const cssString = (value: string) =>
	'"' +
	value
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/[\n\r\f]/g, ' ') +
	'"'

export function htmlDocument(
	html: string,
	defaults: {
		fontSize: number
		fontFamily: string
		fontWeight: string
		color: string | null
		style: Record<string, any>
	},
) {
	const { style } = defaults
	const css = [
		`font-family:${cssString(defaults.fontFamily)}`,
		`font-size:${defaults.fontSize}px`,
		`font-weight:${defaults.fontWeight}`,
		...(defaults.color == null ? [] : [`color:${defaults.color}`]),
		'margin:0',
	]

	if (['italic', 'oblique', 'normal'].includes(style.fontStyle)) {
		css.push(`font-style:${style.fontStyle}`)
	}

	if (['left', 'center', 'right', 'justify'].includes(style.textAlign)) {
		css.push(`text-align:${style.textAlign}`)
	}

	if (Number.isFinite(Number(style.lineHeight)) && Number(style.lineHeight) > 0) {
		css.push(`line-height:${Number(style.lineHeight)}px`)
	}

	// Append the body defaults as NativeScript does, without escaping authored
	// markup. Escape '<' in generated CSS so a font name cannot close the style.
	return html + '<style>body{' + css.join(';').replace(/</g, '\\3c ') + '}</style>'
}

export function parseHtmlText(
	html: string,
	defaults: {
		fontSize: number
		fontFamily: string
		fontWeight: string
		color: any
		appearance?: any
		style: Record<string, any>
	},
) {
	const native = globalThis as any
	if (!html) {
		return native.NSAttributedString.alloc().initWithString('')
	}

	// The parsed string bakes in a static color, so a semantic default must
	// resolve under the view's appearance. An unconvertible color leaves body
	// text to the importer's default.
	const rgb = srgbComponents(defaults.color, defaults.appearance)
	const color = rgb
		? `rgb(${[rgb.red, rgb.green, rgb.blue].map((value) => Math.round(value * 255)).join(',')})`
		: null
	const data = native.NSString.stringWithString(
		htmlDocument(html, { ...defaults, color }),
	).dataUsingEncoding(native.NSUTF8StringEncoding)

	const result = native.NSAttributedString.alloc().initWithDataOptionsDocumentAttributesError(
		data,
		{
			[native.NSDocumentTypeDocumentAttribute]: native.NSHTMLTextDocumentType,
			[native.NSCharacterEncodingDocumentAttribute]: native.NSUTF8StringEncoding,
		},
		null,
		null,
	)

	if (!result) {
		throw new Error('AppKit htmlview could not parse HTML')
	}

	return result
}
