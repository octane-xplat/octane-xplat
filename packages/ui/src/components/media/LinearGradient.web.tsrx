/** @jsxImportSource @octane-xplat/jsx/dom */
import type { LinearGradientProps } from '../../internal-props'

/** Internal gradient surface — CSS linear-gradient on web. */
export function LinearGradient(props: LinearGradientProps) {
	const dir = props.direction === 'horizontal' ? 'to right' : 'to bottom'
	return (
		<div
			id={props.id}
			className={props.className}
			style={{
				backgroundImage: `linear-gradient(${dir}, ${props.colors.join(', ')})`,
				...(typeof props.style === 'object' && props.style !== null ? props.style : {}),
			}}
		/>
	)
}
