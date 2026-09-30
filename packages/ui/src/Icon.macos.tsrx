/** @jsxImportSource @xplat/macos/renderer */
import type { IconProps } from './props'
import { getIcon } from './icons'

/** Icon — no svgview/NSImage glyph path on the AppKit host yet, so the
 *  registered glyph name renders as text. `size` still sizes the frame so
 *  layouts and the parity sweep measure the declared box. */
export function Icon(props: IconProps) @{
	const size = props.size ?? 24
	const glyph = getIcon(props.name)

	<label
		className={props.className}
		style={{ width: size, height: size, fontSize: size * 0.75, ...props.style }}
		accessibilityLabel={props.accessibilityLabel ?? props.name}
	>
		{glyph?.font?.glyph ?? props.name}
	</label>
}
