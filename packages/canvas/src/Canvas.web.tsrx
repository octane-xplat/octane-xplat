/** @jsxImportSource @octane-xplat/jsx/dom */
import type { JSX } from 'octane/jsx-runtime'
import { useMemo, useRef } from 'octane'
import type { CanvasProps } from './props'

/** Canvas — a plain <canvas>. `onReady` fires at mount with the element
 *  and the resolved context. */
export function Canvas(props: CanvasProps): JSX.Element @{
	// Keep the element callback referentially stable — a fresh closure each
	// render makes the web renderer detach/reattach it, refiring onReady.
	const propsRef = useRef(props)
	propsRef.current = props
	const canvasRef = useMemo(
		() => (el: HTMLCanvasElement | null) => {
			if (!el) {
				return
			}

			propsRef.current.onReady?.({
				canvas: el,
				context: propsRef.current.context ? el.getContext(propsRef.current.context) : null,
			})
		},
		[],
	)

	<canvas
		id={props.id}
		className={props.className}
		style={{
			width: typeof props.width === 'string' ? props.width : undefined,
			height: typeof props.height === 'string' ? props.height : undefined,
			...props.style,
		}}
		width={typeof props.width === 'number' ? props.width : undefined}
		height={typeof props.height === 'number' ? props.height : undefined}
		ref={canvasRef}
	/>
}
