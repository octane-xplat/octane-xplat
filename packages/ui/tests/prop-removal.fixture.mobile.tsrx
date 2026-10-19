/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from '../src/style-merge'
export function PropRemoval(props: { text?: string; className?: string; style?: any }) @{
	<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
		<label id="target" text={props.text} className={props.className} style={props.style} />
	</masonview>
}
