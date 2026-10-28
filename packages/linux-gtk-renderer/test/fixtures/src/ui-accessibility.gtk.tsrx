/** @jsxImportSource @octane-xplat/jsx */
import { View, TextInput } from '@octane-xplat/ui'
import type { TextInputHandle, TextInputProps } from '@octane-xplat/ui'
export const inputRef: { current: TextInputHandle | null } = { current: null }
export function Accessibility(props: {
	state?: any; input?: Partial<TextInputProps>; editBlocked?: boolean; entryState?: any;
	switchState?: any; active?: boolean; hidden?: boolean; enabled?: boolean;
}) @{
	<View style={{ width: 300, height: 360 }}>
		<masonview id="a11y-state" accessibilityRole="checkbox" accessibilityState={props.state} accessible={!props.hidden} isEnabled={props.enabled} style={{ width: 50, height: 30 }} />
		<textfield id="a11y-entry" text="Native entry" editable={!props.editBlocked} accessibilityState={props.entryState} style={{ width: 220, height: 32 }} />
		<switch id="a11y-switch" checked={props.active} accessibilityState={props.switchState} />
		<TextInput {...props.input} id="a11y-shared" ref={inputRef} />
	</View>
}
