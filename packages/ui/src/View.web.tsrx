/** Neutral flex-column container — the RN-shaped default block. */
export function View(props: {
  className?: any;
  style?: any;
  children?: any;
}) @{
	<div className={['vx-view', props.className]} style={props.style}>
		{props.children}
	</div>
}
