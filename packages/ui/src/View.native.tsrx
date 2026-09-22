/** @jsxImportSource @nativescript-community/octane */
/** Neutral flex-column container — flexboxlayout on native. */
export function View(props: {
  className?: any;
  style?: any;
  children?: any;
}) @{
	<flexboxlayout flexDirection="column" className={props.className} style={props.style}>
		{props.children}
	</flexboxlayout>
}
