/** @jsxImportSource @octane-xplat/jsx/dom */
import { useViewShot } from './use-view-shot'
import type { ViewShotProps } from './props'
import type { JSX } from 'octane/jsx-runtime'

export function ViewShot(props: ViewShotProps): JSX.Element {
	const attach: (view: HTMLDivElement | null) => void = useViewShot(props)
	return (
		<div ref={attach} id={props.id} className={props.className} style={props.style}>
			{props.children}
		</div>
	)
}

export default ViewShot
