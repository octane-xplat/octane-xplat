/** @jsxImportSource @octane-xplat/jsx */
import { useEffect } from 'octane'
import type { CanvasContextKind, CanvasProps } from './props'

/** AppKit mounts a neutral frame. No drawing surface or GPU is created. */
export function Canvas(props: CanvasProps): unknown @{
	useEffect(() => {
		// Preserve deferred acquisition without pretending this is a native view.
		const canvas = Object.freeze({
			getContext: (_kind: CanvasContextKind, _options?: any): null => null,
		})

		props.onReady?.({ canvas, context: null })
	}, [])

	<masonview
		id={props.id}
		className={props.className}
		style={
			typeof props.style === 'string'
				? props.style
				: { display: 'grid', width: props.width, height: props.height, ...props.style }
		}
	/>
}
