/** Neutral flex-column container — flexboxlayout on native. */
export function View(props: {
  className?: unknown;
  style?: unknown;
  children?: unknown;
}) @{
	<flexboxlayout flexDirection="column" className={props.className} style={props.style}>
		{props.children}
	</flexboxlayout>
}
