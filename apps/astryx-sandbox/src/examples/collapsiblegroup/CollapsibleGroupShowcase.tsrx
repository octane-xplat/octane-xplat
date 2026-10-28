// Port of upstream CollapsibleGroup/CollapsibleGroupShowcase.tsx (Astryx 0.6.4, MIT).
import { Collapsible, CollapsibleGroup, Stack, Text } from '@octane-xplat/ui'

export function CollapsibleGroupShowcase() @{
	<Stack gap={6}>
		<CollapsibleGroup type="single" defaultValue="a">
			<Stack gap={2} maxWidth={420}>
				<Collapsible trigger="First" value="a">
					<Text type="body" color="secondary">
						Single-open group.
					</Text>
				</Collapsible>
				<Collapsible trigger="Second" value="b">
					<Text type="body" color="secondary">
						Only one open at a time.
					</Text>
				</Collapsible>
			</Stack>
		</CollapsibleGroup>
		<CollapsibleGroup type="multiple" defaultValue={['x']}>
			<Stack gap={2} maxWidth={420}>
				<Collapsible trigger="Alpha" value="x">
					<Text type="body" color="secondary">
						Multi-open group.
					</Text>
				</Collapsible>
				<Collapsible trigger="Beta" value="y">
					<Text type="body" color="secondary">
						Both can stay open.
					</Text>
				</Collapsible>
			</Stack>
		</CollapsibleGroup>
	</Stack>
}
