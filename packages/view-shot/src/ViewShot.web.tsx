/** @jsxImportSource @octane-xplat/jsx/dom */
import { useViewShot } from './use-view-shot'
import type { ViewShotProps } from './props'

export function ViewShot(props: ViewShotProps) {
	const attach: (view: HTMLDivElement | null) => void = useViewShot(props)
	return (
		<div ref={attach} id={props.id} className={props.className} style={props.style}>
			{props.children}
		</div>
	)
}
export default ViewShot
