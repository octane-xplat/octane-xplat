/** Neutral flex-column container — the RN-shaped default block. */
export function View(props: {
  className?: unknown;
  style?: unknown;
  children?: unknown;
}) @{
	<div className={['vx-view', props.className]} style={props.style}>
		{props.children}
	</div>
}
