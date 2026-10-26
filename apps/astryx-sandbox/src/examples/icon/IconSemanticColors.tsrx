// Port of upstream Icon/IconSemanticColors.tsx (Astryx 0.6.4, MIT).
import { HStack, Icon, Text, VStack } from '@octane-xplat/ui'

const entries = [
	['xplat-search', 'primary'],
	['sandbox-menu', 'secondary'],
	['xplat-info', 'tertiary'],
	['xplat-clock', 'disabled'],
	['xplat-calendar', 'accent'],
	['xplat-check', 'success'],
	['xplat-error', 'error'],
	['xplat-warning', 'warning'],
] as const

export function IconSemanticColors() @{
	<HStack gap={4} wrap="wrap">
		{entries.map(([name, color]) => (
			<VStack key={color} gap={1} hAlign="center">
				<Icon name={name as any} color={color} />
				<Text type="supporting">{color}</Text>
			</VStack>
		))}
	</HStack>
}
