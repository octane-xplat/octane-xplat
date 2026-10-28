// Port of upstream Item/ItemDocumentTabs.tsx (Astryx 0.6.4, MIT).
// Upstream uses useContainerReveal for the hover-reveal close button —
// a unit-8 contract; re-authored here as an always-visible ghost affordance.
import { Divider, HStack, Icon, IconButton, Item } from '@octane-xplat/ui'

const TABS = [
	{ name: 'Project brief', isActive: true },
	{ name: 'Research notes', isActive: false },
	{ name: 'Interaction prototype', isActive: false },
]

export function ItemDocumentTabs() @{
	<HStack width="100%" maxWidth={600} gap={0.5} vAlign="center">
		<HStack
			aria-label="Open documents"
			vAlign="center"
			paddingInline={2}
			paddingBlock={1}
			isScrollable
			style={{ minWidth: 0, flexShrink: 1 }}
		>
			{TABS.map((tab, i) => (
				<>
					{i > 0 ? (
						<Divider
							orientation="vertical"
							style={{
								height: 16,
								visibility: TABS[i - 1]?.isActive || tab.isActive ? 'hidden' : 'visible',
							}}
						/>
					) : null}
					<Item
						label={tab.name}
						density="compact"
						isSelected={tab.isActive}
						onPress={() => {}}
						startContent={
							<Icon
								name="sandbox-document-duplicate"
								size={16}
								color={tab.isActive ? 'primary' : 'secondary'}
							/>
						}
						endContent={
							<IconButton
								label={`Close ${tab.name}`}
								variant="ghost"
								size="sm"
								icon={<Icon name="xplat-close" size={16} />}
							/>
						}
						style={{ flexShrink: 1, width: 164, minWidth: 96 }}
					/>
				</>
			))}
		</HStack>
		<IconButton
			label="New document"
			tooltip="New document"
			variant="ghost"
			size="sm"
			icon={<Icon name="sandbox-plus" size={16} color="secondary" />}
		/>
	</HStack>
}
