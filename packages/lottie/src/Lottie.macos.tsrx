/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect } from 'octane'
import type { LottieProps } from './props'

/** AppKit has no Lottie engine. Never load the iOS/Android vendor here. */
export function Lottie(props: LottieProps) @{
	useEffect(() => {
		props.onError?.({ message: 'Lottie animations are unsupported by the AppKit host' })
	}, [])

	<label id={props.id} className="vx-unsupported">Lottie animations are unsupported by the AppKit host</label>
}
