/** @jsxImportSource @octane-xplat/jsx */
import type { LinearGradientProps } from '../../internal-props'

/** Internal gradient surface — GTK renders `background-image` through the
 *  same style channel as every other style prop, and Gtk CSS parses
 *  `linear-gradient()` natively (the web leaf's exact output). The shared
 *  native leaf needs a platform view hook (`linear-gradient-apply`); GTK
 *  needs none. */
export function LinearGradient(props: LinearGradientProps) @{
	const dir = props.direction === 'horizontal' ? 'to right' : 'to bottom'
	<masonview
		id={props.id}
		className={props.className}
		style={{
			backgroundImage: `linear-gradient(${dir}, ${props.colors.join(', ')})`,
			...(typeof props.style === 'object' && props.style !== null ? props.style : {}),
		}}
	/>
}
