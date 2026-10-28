// Port of upstream Token/TokenColors.tsx (Astryx 0.6.4, MIT).
import { Stack, Text, Token } from '@octane-xplat/ui'

const COLORS = [
	'default',
	'red',
	'orange',
	'yellow',
	'green',
	'teal',
	'cyan',
	'blue',
	'purple',
	'pink',
	'gray',
] as const

export function TokenColors() @{
	<Stack direction="vertical" gap={10} width="100%" style={{ maxWidth: 400 }}>
		<Stack direction="vertical" gap={2}>
			<Text type="supporting" color="secondary">
				Default
			</Text>
			<Stack direction="horizontal" gap={1} wrap="wrap">
				{COLORS.map((color) => (
					<Token key={color} label={color[0].toUpperCase() + color.slice(1)} color={color} />
				))}
			</Stack>
		</Stack>
		<Stack direction="vertical" gap={2}>
			<Text type="supporting" color="secondary">
				Disabled
			</Text>
			<Stack direction="horizontal" gap={1} wrap="wrap">
				{COLORS.map((color) => (
					<Token
						key={color}
						label={color[0].toUpperCase() + color.slice(1)}
						color={color}
						isDisabled
					/>
				))}
			</Stack>
		</Stack>
	</Stack>
}
