/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	Button,
	ButtonGroup,
	ClickableCard,
	IconButton,
	ToggleButton,
	View,
	Text,
} from '@octane-xplat/ui'

export const counts: Record<string, any> = { presses: 0, toggles: [], card: 0, icon: 0 }

export function Probe(props: { disabled?: boolean }) @{
	<View style={{ gap: 8, padding: 16 }}>
		<Button
			id="btn"
			label="Save"
			variant="primary"
			clickAction={() => { counts.presses++ }}
		/>
		<Button id="btn-dis" label="Noop" isDisabled clickAction={() => { counts.presses += 100 }} />
		<IconButton id="icon-btn" icon="check" label="Confirm" clickAction={() => { counts.icon++ }} />
		<ToggleButton
			id="tgl"
			label="Bold"
			onPressedChange={(p) => counts.toggles.push(p)}
		/>
		<ButtonGroup id="grp" label="Group" isDisabled={props.disabled}>
			<Button id="grp-a" label="A" clickAction={() => { counts.presses += 10 }} />
		</ButtonGroup>
		<ClickableCard id="card" label="Card" onPress={() => { counts.card++ }}>
			<Text>Body</Text>
		</ClickableCard>
		<View id="btn-outside" style={{ width: 200, height: 40 }} />
	</View>
}
