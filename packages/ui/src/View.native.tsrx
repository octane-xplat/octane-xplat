/** @jsxImportSource @nativescript-community/octane */
/** Neutral flex-column container — flexboxlayout on native.
 *  Gesture props map 1:1 to NS gesture events (onPan → 'pan', etc.) —
 *  the driver's onX → eventName rule covers them generically. */
export function View(props: {
  className?: any;
  style?: any;
  children?: any;
  id?: string;
  onPan?: (e: { deltaX: number; deltaY: number; state: number }) => void;
  onSwipe?: (e: { direction: number }) => void;
}) @{
	<flexboxlayout
		id={props.id}
		flexDirection="column"
		className={props.className}
		style={props.style}
		onPan={props.onPan}
		onSwipe={props.onSwipe}
	>
		{props.children}
	</flexboxlayout>
}
