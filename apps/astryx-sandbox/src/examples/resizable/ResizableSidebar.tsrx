// Port of upstream Resizable/ResizableSidebar.tsx (Astryx 0.6.4, MIT).
import {
	Card,
	Heading,
	Layout,
	LayoutContent,
	LayoutPanel,
	List,
	ListItem,
	ResizeHandle,
	Text,
	useResizable,
	VStack,
} from '@octane-xplat/ui'

export function ResizableSidebar() @{
	const sidebar = useResizable({
		defaultSize: 240,
		minSize: 160,
		maxSize: 360,
		collapsible: true,
		snaps: [200, 280],
	})

	<Card variant="muted" height={320} width={620}>
		<Layout
			height="fill"
			start={
				<>
					<LayoutPanel width={sidebar.size} resizable={sidebar.props}>
						<VStack gap={2}>
							<Heading level={4}>Files</Heading>
							<List>
								<ListItem label="Documents" isSelected />
								<ListItem label="Photos" />
								<ListItem label="Archive" />
							</List>
							<Text type="supporting" color="secondary">
								{Math.round(sidebar.size)}px — snaps at 200/280
							</Text>
						</VStack>
					</LayoutPanel>
					<ResizeHandle
						direction="horizontal"
						hasDivider
						resizable={sidebar.props}
						label="Resize sidebar"
					/>
				</>
			}
			content={
				<LayoutContent>
					<VStack gap={2}>
						<Heading level={4}>Preview</Heading>
						<Text color="secondary">Drag the divider; the panel snaps to 200px and 280px.</Text>
					</VStack>
				</LayoutContent>
			}
		/>
	</Card>
}
