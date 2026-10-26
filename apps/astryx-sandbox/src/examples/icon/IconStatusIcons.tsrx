// Port of upstream Icon/IconStatusIcons.tsx (Astryx 0.6.4, MIT).
import { HStack, Icon, Text, VStack } from '@octane-xplat/ui'

const statuses = [
	{ icon: 'xplat-check', color: 'success', label: 'Deployed successfully' },
	{ icon: 'xplat-warning', color: 'warning', label: 'Build has warnings' },
	{ icon: 'xplat-error', color: 'error', label: 'Pipeline failed' },
	{ icon: 'xplat-info', color: 'accent', label: 'New version available' },
] as const

export function IconStatusIcons() @{
	<VStack gap={3}>
		{statuses.map((s) => (
			<HStack key={s.label} gap={2} vAlign="center">
				<Icon name={s.icon as any} color={s.color} size={16} />
				<Text type="body">{s.label}</Text>
			</HStack>
		))}
	</VStack>
}
