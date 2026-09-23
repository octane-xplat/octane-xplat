/** @jsxImportSource @nativescript-community/octane */
import type { ScrollViewProps } from "./props";
/** Scroll container — NS <scrollview>. NS ScrollView hosts exactly one
 *  child view, so children are wrapped in a column flexboxlayout — the
 *  same content-container indirection RN's ScrollView does internally.
 *  `horizontal` maps to NS's orientation prop. */
export function ScrollView(props: ScrollViewProps) @{
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
