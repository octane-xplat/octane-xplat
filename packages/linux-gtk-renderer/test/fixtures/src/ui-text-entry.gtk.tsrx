/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { View, TextInput } from '@octane-xplat/ui'
import type { TextInputHandle, TextInputProps } from '@octane-xplat/ui'

// Exercise the curated GTK root, including the shared input's native handle.
export const inputRef: { current: TextInputHandle | null } = { current: null }
export const changes: string[] = []
export const submits: number[] = []
export const focusEvents: string[] = []
export const controlledRef: { current: TextInputHandle | null } = { current: null }
export const controlledChanges: string[] = []
export const controlledValue = { current: '' }
function ControlledEntry(props: { mode: 'accept' | 'reject' }) @{
	const [value, setValue] = useState('12')
	controlledValue.current = value
	<TextInput id="entry-controlled" ref={controlledRef} value={value}
		onChange={(next) => {
			controlledChanges.push(next)
			if (props.mode === 'accept' || /^\d*$/.test(next)) setValue(next)
		}} style={{ width: 200 }} />
}
export function TextEntry(props: {
	value?: string; defaultValue?: string; version: number; generation?: number; disabled?: boolean; readOnly?: boolean;
	secure?: boolean; keyboard?: TextInputProps['keyboardType']; placeholder?: string; name?: string;
	clear?: boolean; label?: string; description?: string; aliasDisabled?: boolean;
	controlledMode?: 'accept' | 'reject'; leading?: 'node' | 'none';
	placeholderColor?: string; returnKey?: TextInputProps['returnKeyType']; testID?: string; className?: string;
}) @{
	<View id="entry-root" style={{ width: 240, height: 260 }}>
		<TextInput key={props.generation} id="entry" ref={inputRef} value={props.value} defaultValue={props.defaultValue}
			isDisabled={props.disabled} isReadOnly={props.readOnly} secure={props.secure}
			placeholderTextColor={props.placeholderColor} returnKeyType={props.returnKey} testID={props.testID} className={props.className}
			keyboardType={props.keyboard} placeholder={props.placeholder} accessibilityLabel={props.name}
			hasClear={props.clear} startIcon={props.leading === "none" ? undefined : props.leading === "node" ? <label id="entry-leading" text="Leading" /> : "xplat-search"} label={props.label} description={props.description}
			onChange={(value) => changes.push(value)} onClear={() => focusEvents.push('clear')}
			onSubmit={() => submits.push(props.version)} onFocus={() => focusEvents.push('focus', 'focus:' + props.version)}
			onBlur={() => focusEvents.push('blur')} style={{ width: 200 }}
		/>
		<textfield id="entry-peer" text="Peer" style={{ width: 200, height: 32 }} />
		<textfield id="entry-aliases" text="Aliases" isEnabled={!props.aliasDisabled} style={{ width: 200, height: 32 }} />
		{props.controlledMode ? <ControlledEntry mode={props.controlledMode} /> : null}
	</View>
}
