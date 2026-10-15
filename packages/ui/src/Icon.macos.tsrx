/** @jsxImportSource @octane-xplat/macos-renderer */
import type { IconProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Image } from './Image.macos'
import { glyphSvgMarkup } from './svg-glyph'
import { getIcon } from './icons'
import { useIconRegistry } from './icon-registry-context'

export function Icon(props: IconProps) @{
	const size = props.size ?? 24
	const inheritedRegistry = useIconRegistry()
	const glyph = getIcon(props.name, props.registry ?? inheritedRegistry)
	const markup = glyph && glyphSvgMarkup(glyph, props.color ?? '#000000')
	if (markup) return <Image src={markup} id={props.id} className={cx(props.className)}
		alt={props.accessibilityLabel ?? ''}
		style={{ width: size, height: size }} />

	<label
		id={props.id}
		className={cx(props.className)}
		style={{ width: size, height: size, fontSize: size * 0.75 }}
		accessibilityLabel={props.accessibilityLabel}
	>
		{glyph?.font?.glyph ?? props.name}
	</label>
}
