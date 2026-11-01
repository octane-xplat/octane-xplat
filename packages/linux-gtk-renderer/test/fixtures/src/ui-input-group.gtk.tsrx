/** @jsxImportSource @octane-xplat/jsx */
import { View, TextInput, Pressable } from '@octane-xplat/ui'
import { InputGroup, InputGroupText } from '@octane-xplat/ui'
import type { InputGroupProps, TextInputHandle } from '@octane-xplat/ui'
export const groupRef: { current: any } = { current: null }
export const prefixRef: { current: any } = { current: null }
export const handles: Array<TextInputHandle | null> = []
export const actions = { pressed: 0 }
export function GroupScene(props: Partial<InputGroupProps> & { customPrefix?: boolean }) @{
	<View style={{ width: 400, height: 400 }}>
		<InputGroup label="Amount" description="Before tax" {...props} ref={groupRef} id="amount-group">
			<InputGroupText id="prefix" ref={prefixRef}>{props.customPrefix ? <label text="USD" /> : '$'}</InputGroupText>
			<TextInput defaultValue="12" ref={(handle) => { handles[0] = handle }} />
			<TextInput defaultValue="34" size="sm" ref={(handle) => { handles[1] = handle }} />
			<Pressable id="suffix-action" accessibilityRole="button" accessibilityLabel="Apply"
				onPress={() => { actions.pressed++ }}><label text="Apply" /></Pressable>
		</InputGroup>
	</View>
}

export const roleRef: { current: any } = { current: null }
export const roleHandle: { current: TextInputHandle | null } = { current: null }
export function RoleScene(props: { role?: 'group' | 'button' }) @{
	<masonview id="role-container" ref={roleRef} accessibilityRole={props.role}
		accessibilityLabel="Container" style={{ display: 'flex', width: 320, height: 100 }}>
		<TextInput defaultValue="Retained" ref={roleHandle} />
	</masonview>
}
