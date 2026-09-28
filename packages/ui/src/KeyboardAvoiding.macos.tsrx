/** @jsxImportSource @xplat/macos/renderer */
import type { KeyboardAvoidingProps } from './props'

export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	<flexboxlayout flexDirection="column" className={props.className} style={props.style}>
		{props.children}
	</flexboxlayout>
}
