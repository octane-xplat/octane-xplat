/** @jsxImportSource @nativescript-community/octane */
export function Row(props: {
  className?: any;
  style?: any;
  children?: any;
}) @{
	<flexboxlayout flexDirection="row" className={props.className} style={props.style}>
		{props.children}
	</flexboxlayout>
}
