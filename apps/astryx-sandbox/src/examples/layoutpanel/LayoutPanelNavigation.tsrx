// Port of upstream LayoutPanel/LayoutPanelNavigation.tsx (Astryx 0.6.4, MIT).
import { Card, Center, Layout, LayoutContent, LayoutPanel, List, ListItem } from '@octane-xplat/ui'

export function LayoutPanelNavigation() @{
	<Center width={400}>
		<Layout
			style={{ width: '100%' }}
			height="fill"
			start={
				<LayoutPanel hasDivider width={140} role="navigation">
					<List>
						<ListItem label="Overview" isSelected />
						<ListItem label="Analytics" />
						<ListItem label="Settings" />
					</List>
				</LayoutPanel>
			}
			content={
				<LayoutContent>
					<Card variant="muted" />
				</LayoutContent>
			}
		/>
	</Center>
}
