// Port of upstream Button/ButtonWithEndSlot.tsx (Astryx 0.6.4, MIT).
// Upstream Badge variant prop → app badge classes (Xplat Badge is an
// unstyled composition container).
import { Badge, Button, Stack, Text } from '@octane-xplat/ui'

export function ButtonWithEndSlot() @{
	return (
		<Stack direction="vertical" gap={4}>
			<Text type="supporting" color="secondary">
				Trailing badges for counts or status
			</Text>
			<Stack direction="horizontal" gap={3} vAlign="center">
				<Button
					label="Messages"
					variant="primary"
					endContent={<Badge className="sb-badge sb-badge--info"><Text>3</Text></Badge>}
				/>
				<Button
					label="Notifications"
					variant="secondary"
					endContent={<Badge className="sb-badge sb-badge--warning"><Text>12</Text></Badge>}
				/>
				<Button
					label="Updates"
					variant="ghost"
					endContent={<Badge className="sb-badge sb-badge--neutral"><Text>New</Text></Badge>}
				/>
			</Stack>
		</Stack>
	)
}
