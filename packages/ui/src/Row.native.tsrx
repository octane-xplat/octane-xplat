export function Row(props: {
  className?: unknown;
  style?: unknown;
  children?: unknown;
}) @{
	<flexboxlayout flexDirection="row" className={props.className} style={props.style}>
		{props.children}
	</flexboxlayout>
}
