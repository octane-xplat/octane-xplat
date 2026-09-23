/** Neutral flex-column container — the RN-shaped default block.
 *  Gesture props are accepted for API parity; web pointer plumbing is a
 *  pending leaf task (pointerdown/move/up + setPointerCapture). */
export function View(props: {
  className?: any;
  style?: any;
  children?: any;
  id?: string;
  /** Forwards to the element's `ref` — `ref` is runtime-reserved on
   *  component elements, so leaves expose `bind` instead. */
  bind?: (el: any) => void;
  onPan?: (e: { deltaX: number; deltaY: number; state: number }) => void;
  onSwipe?: (e: { direction: number }) => void;
}) @{
	<div id={props.id} ref={props.bind} className={['vx-view', props.className]} style={props.style}>
		{props.children}
	</div>
}
