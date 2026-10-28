/** @jsxImportSource @octane-xplat/jsx */
import { View } from '@octane-xplat/ui'
import { TextInput } from '../../../../ui/src/TextInput'
import type { TextInputHandle, TextInputProps } from '../../../../ui/src/props'

// The native component is exercised directly before its complete prop surface
// (including field-tooltip behavior) is promoted to the curated GTK barrel.
export const inputRef: { current: TextInputHandle | null } = { current: null }
export const changes: string[] = []
export const submits: number[] = []
export const focusEvents: string[] = []
export function TextEntry(props: {
	value?: string; defaultValue?: string; version: number; generation?: number; disabled?: boolean; readOnly?: boolean;
	secure?: boolean; keyboard?: TextInputProps['keyboardType']; placeholder?: string; name?: string;
	clear?: boolean; label?: string; description?: string; aliasDisabled?: boolean;
}) @{
	<View id="entry-root" style={{ width: 240, height: 260 }}>
		<TextInput key={props.generation} id="entry" ref={inputRef} value={props.value} defaultValue={props.defaultValue}
			isDisabled={props.disabled} isReadOnly={props.readOnly} secure={props.secure}
			keyboardType={props.keyboard} placeholder={props.placeholder} accessibilityLabel={props.name}
			hasClear={props.clear} startIcon="xplat-search" label={props.label} description={props.description}
			onChange={(value) => changes.push(value)} onClear={() => focusEvents.push('clear')}
			onSubmit={() => submits.push(props.version)} onFocus={() => focusEvents.push('focus', 'focus:' + props.version)}
			onBlur={() => focusEvents.push('blur')} style={{ width: 200 }}
		/>
		<textfield id="entry-peer" text="Peer" style={{ width: 200, height: 32 }} />
		<textfield id="entry-aliases" text="Aliases" isEnabled={!props.aliasDisabled} style={{ width: 200, height: 32 }} />
	</View>
}
