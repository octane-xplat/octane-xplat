// Port of upstream Resizable/ResizableShowcase.tsx (Astryx 0.6.4, MIT).
import {
	Card,
	Heading,
	Layout,
	LayoutContent,
	LayoutPanel,
	ResizeHandle,
	Text,
	useResizable,
	VStack,
} from '@octane-xplat/ui'

export function ResizableShowcase() @{
	const sidebar = useResizable({ defaultSize: 200, minSize: 120, maxSize: 400 })

	<Card variant="muted" height={280} width={600}>
		<Layout
			height="fill"
			start={
				<>
					<LayoutPanel width={sidebar.size} hasDivider={false}>
						<VStack gap={2}>
							<Heading level={4}>Sidebar</Heading>
							<Text color="secondary">{Math.round(sidebar.size)}px wide</Text>
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
						<Heading level={4}>Content</Heading>
						<Text color="secondary">Drag the handle to resize the sidebar.</Text>
					</VStack>
				</LayoutContent>
			}
		/>
	</Card>
}
