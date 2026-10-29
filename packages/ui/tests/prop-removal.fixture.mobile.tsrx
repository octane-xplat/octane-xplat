/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../src/internal/layout/style-merge'
export function PropRemoval(props: { text?: string; className?: string; style?: any }) @{
	<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
		<label id="target" text={props.text} className={props.className} style={props.style} />
	</masonview>
}
