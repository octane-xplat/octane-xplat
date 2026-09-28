/** @jsxImportSource @xplat/macos/renderer */
import type { KeyboardAvoidingProps, SafeAreaProps } from './props'

export function SafeArea(props: SafeAreaProps) @{
	<flexboxlayout flexDirection="column" className={props.className} style={props.style}>{props.children}</flexboxlayout>
}

export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	<flexboxlayout flexDirection="column" className={props.className} style={props.style}>{props.children}</flexboxlayout>
}
