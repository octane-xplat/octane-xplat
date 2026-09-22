export function Row(props: {
  className?: any;
  style?: any;
  children?: any;
}) @{
	<div className={['vx-row', props.className]} style={props.style}>
		{props.children}
	</div>
}
