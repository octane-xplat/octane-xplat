/** @jsxImportSource @octane-xplat/jsx */
import type { View } from '@nativescript/core'
import { useViewShot } from './use-view-shot'
import type { ViewShotProps } from './props'

export function ViewShot(props: ViewShotProps): unknown {
	const attach: (view: View | null) => void = useViewShot(props)
	return (
		<masonview ref={attach} id={props.id} className={props.className} style={props.style}>
			{props.children}
		</masonview>
	)
}

export default ViewShot
