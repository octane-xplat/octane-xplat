// Port of upstream LayoutPanel/LayoutPanelShowcase.tsx (Astryx 0.6.4, MIT).
import {
	Card,
	Center,
	Layout,
	LayoutContent,
	LayoutFooter,
	LayoutHeader,
	LayoutPanel,
	List,
	ListItem,
} from '@octane-xplat/ui'

export function LayoutPanelShowcase() @{
	<Center width={400}>
		<Layout
			style={{ width: '100%' }}
			height="fill"
			header={
				<LayoutHeader hasDivider>
					<Card variant="muted" />
				</LayoutHeader>
			}
			start={
				<LayoutPanel hasDivider width={140} role="navigation">
					<List>
						<ListItem label="Overview" isSelected />
						<ListItem label="Analytics" />
						<ListItem label="Reports" />
						<ListItem label="Settings" />
					</List>
				</LayoutPanel>
			}
			content={
				<LayoutContent>
					<Card variant="muted" />
				</LayoutContent>
			}
			footer={
				<LayoutFooter hasDivider>
					<Card variant="muted" />
				</LayoutFooter>
			}
		/>
	</Center>
}
