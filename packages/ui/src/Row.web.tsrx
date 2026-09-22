export function Row(props: {
  className?: unknown;
  style?: unknown;
  children?: unknown;
}) @{
	<div className={['vx-row', props.className]} style={props.style}>
		{props.children}
	</div>
}
