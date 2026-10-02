/** @jsxImportSource @xplat/macos/renderer */
import type { IconProps } from './props'
import { Image } from './Image.macos'
import { glyphSvgMarkup } from './svg-glyph'
import { getIcon } from './icons'

export function Icon(props: IconProps) @{
	const size = props.size ?? 24
	const glyph = getIcon(props.name)
	const markup = glyph && glyphSvgMarkup(glyph, props.color ?? '#000000')
	if (markup) return <Image src={markup} id={props.id} className={props.className}
		alt={props.name}
		style={{ width: size, height: size }} />

	<label
		id={props.id}
		className={props.className}
		style={{ width: size, height: size, fontSize: size * 0.75 }}
		accessibilityLabel={props.name}
	>
		{glyph?.font?.glyph ?? props.name}
	</label>
}
