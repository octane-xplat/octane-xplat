/** @jsxImportSource @xplat/macos/renderer */
import type { TextAreaProps, TextInputProps } from './props'

export function TextInput(props: TextInputProps) @{
	<textfield id={props.id} value={props.value} placeholder={props.placeholder} className={props.className} style={props.style} onTextChange={props.onChange} accessibilityLabel={props.accessibilityLabel} />
}

export function TextArea(props: TextAreaProps) @{
	<textview id={props.id} value={props.value} placeholder={props.placeholder} className={props.className} style={props.style} onTextChange={props.onChange} accessibilityLabel={props.accessibilityLabel} />
}
