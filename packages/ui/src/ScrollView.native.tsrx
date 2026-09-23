/** @jsxImportSource @nativescript-community/octane */
/** Scroll container — NS <scrollview>. NS ScrollView hosts exactly one
 *  child view, so children are wrapped in a column flexboxlayout — the
 *  same content-container indirection RN's ScrollView does internally.
 *  `horizontal` maps to NS's orientation prop. */
export function ScrollView(props: {
  className?: any;
  style?: any;
  id?: string;
  horizontal?: boolean;
  children?: any;
}) @{
	<scrollview
		id={props.id}
		className={props.className}
		style={props.style}
		orientation={props.horizontal ? 'horizontal' : 'vertical'}
	>
		<flexboxlayout flexDirection={props.horizontal ? 'row' : 'column'}>
			{props.children}
		</flexboxlayout>
	</scrollview>
}
