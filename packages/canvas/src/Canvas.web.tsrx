import type { CanvasProps } from './props';

/** Canvas — a plain <canvas>. `onReady` fires at mount with the element
 *  and the resolved context. */
export function Canvas(props: CanvasProps) @{
	<canvas
		id={props.id}
		className={props.className}
		style={props.style}
		width={typeof props.width === 'number' ? props.width : undefined}
		height={typeof props.height === 'number' ? props.height : undefined}
		ref={(el: HTMLCanvasElement | null) => {
			if (!el) {
				return;
			}

			props.onReady?.({
				canvas: el,
				context: props.context ? el.getContext(props.context) : null,
			});
		}}
	/>
}
