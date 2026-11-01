/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text, View } from '@octane-xplat/ui'

export const events: string[] = []
export const buttonRef: { current: any } = { current: null }

export function PressKeys(props: {
	version: number
	disabled?: boolean
	show?: boolean
	role?: 'button' | 'link' | null
	nestedRole?: 'button' | 'link'
}) @{
	<View style={{ width: 300, height: 260 }}>
		{(props.show ?? true) ? (
			<Pressable
				id="key-button"
				ref={buttonRef}
				accessibilityRole={props.role === undefined ? 'button' : props.role ?? undefined}
				accessibilityLabel="Action"
				disabled={props.disabled}
				onPress={() => events.push('press:' + props.version)}
				onPressIn={() => events.push('in:' + props.version)}
				onPressOut={() => events.push('out:' + props.version)}
				style={{ width: 140, height: 36 }}
			>
				<Text id="key-action-label">Action</Text>
			</Pressable>
		) : null}
		<Pressable
			id="key-link"
			accessibilityRole="link"
			onPress={() => events.push('link:' + props.version)}
			style={{ width: 140, height: 36 }}
		>
			<Text>Link</Text>
		</Pressable>
		<Pressable
			id="key-nested"
			accessibilityRole={props.nestedRole ?? 'button'}
			onPress={() => events.push('nested')}
		>
			<textfield id="key-child" text="Child" style={{ width: 180, height: 32 }} />
		</Pressable>
		<masonview
			id="key-neutral"
			onTap={() => events.push('neutral')}
			style={{ width: 100, height: 30 }}
		/>
		<textfield id="key-peer" text="Peer" style={{ width: 180, height: 32 }} />
	</View>
}
