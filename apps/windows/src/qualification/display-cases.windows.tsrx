/** @jsxImportSource @octane-xplat/jsx */
import { Avatar, Badge, Banner, Button, Card, ClickableCard, Text, View } from '@octane-xplat/ui'

export const displayCases = ['card', 'badge', 'avatar', 'banner'] as const
export type DisplayCase = (typeof displayCases)[number]

// A local image removes network availability from the avatar-name check.
const avatarImage =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOQL9z6HwAEPQJFam2brwAAAABJRU5ErkJggg=='

/** Deliberately small public-component cases. Commands change props only;
 * all action callbacks must originate in the external OS/UIA driver. */
export function DisplayCases(props: {
	caseName: DisplayCase
	revision: number
	disabled: boolean
	image: boolean
	details: boolean
	onActivate: (source: string) => void
}): unknown @{
	<View className="core20-viewport">
		@if (props.caseName === 'card') {
			<>
				<Card
					id="core20-card"
					width="100%"
					maxWidth={320}
					padding={2}
					header={<Text id="core20-card-header">{`Card header ${props.revision}`}</Text>}
					footer={<Text id="core20-card-footer">{`Card footer ${props.revision}`}</Text>}
				>
					<Text id="core20-card-body">{`Card body ${props.revision}: a longer sentence that wraps when the window becomes narrow.`}</Text>
				</Card>
				<ClickableCard
					id="core20-clickable-card"
					width="100%"
					maxWidth={320}
					padding={2}
					label={`Open card ${props.revision}`}
					isDisabled={props.disabled}
					onPress={() => props.onActivate('clickable-card')}
				>
					<Text>{`Clickable card ${props.revision}`}</Text>
				</ClickableCard>
			</>
		}
		@if (props.caseName === 'badge') {
			<Badge id="core20-badge" variant={props.revision ? 'success' : 'neutral'}>
				{props.revision ? 0 : 'Ready badge'}
			</Badge>
		}
		@if (props.caseName === 'avatar') {
			<Avatar
				id="core20-avatar"
				name={props.revision ? 'Grace Hopper' : 'Ada Lovelace'}
				size={40}
				src={props.image ? avatarImage : undefined}
			/>
		}
		@if (props.caseName === 'banner') {
			<Banner
				id="core20-banner"
				title={`Banner ${props.revision}`}
				description={`Supporting text ${props.revision}`}
				status={props.revision ? 'warning' : 'info'}
				collapsible={props.details}
				isDismissable
				onDismiss={() => props.onActivate('banner-dismiss')}
				endContent={
					<Button
						id="core20-banner-action"
						label={`Banner action ${props.revision}`}
						isDisabled={props.disabled}
						clickAction={() => props.onActivate('banner-action')}
					/>
				}
			>
				<Text id="core20-banner-content">{`Banner body ${props.revision}`}</Text>
			</Banner>
		}
	</View>
}
