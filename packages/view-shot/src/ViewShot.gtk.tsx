/** @jsxImportSource @octane-xplat/jsx */
import type { HostElement } from '@octane-xplat/jsx/jsx-runtime'
import { useViewShot } from './use-view-shot'
import type { ViewShotProps } from './props'

export function ViewShot(props: ViewShotProps) {
	const attach: (view: HostElement | null) => void = useViewShot(props)
	return (
		<masonview ref={attach} id={props.id} className={props.className} style={props.style}>
			{props.children}
		</masonview>
	)
}
export default ViewShot
