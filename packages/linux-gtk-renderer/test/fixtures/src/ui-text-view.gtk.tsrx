/** @jsxImportSource @octane-xplat/jsx */
import { View } from '@octane-xplat/ui'
export const changes: string[] = []
export const submits: number[] = []
export const focusEvents: string[] = []
export function Multiline(props: {
	value?: string; editable?: boolean; enabled?: boolean; version: number;
	returnKey?: 'done' | 'send' | 'next' | 'go' | 'search'; keyboard?: string;
	autocorrect?: boolean; mounted?: boolean; maxLength?: number;
}) @{
	<View style={{ width: 260, height: 220 }}>
		{props.mounted !== false ? <textview id="multiline" text={props.value}
			editable={props.editable} isEnabled={props.enabled}
			maxLength={props.maxLength}
			keyboardType={props.keyboard} autocorrect={props.autocorrect}
			returnKeyType={props.returnKey} accessibilityLabel="Multiline editor"
			onTextChange={(event: any) => changes.push(event.value)}
			onReturnPress={() => submits.push(props.version)}
			onFocus={() => focusEvents.push('focus')}
			onBlur={() => focusEvents.push('blur')}
			style={{ width: 240, height: 150 }} /> : null}
		<textfield id="peer" text="Peer" style={{ width: 240, height: 32 }} />
	</View>
}
