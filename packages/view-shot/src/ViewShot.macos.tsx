/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import { useViewShot } from './use-view-shot'
import type { ViewShotProps } from './props'

export function ViewShot(props: ViewShotProps) {
	const attach: (view: NSView | null) => void = useViewShot(props)
	return (
		<masonview ref={attach} id={props.id} className={props.className} style={props.style}>
			{props.children}
		</masonview>
	)
}
export default ViewShot
