// Port of upstream VisuallyHidden/VisuallyHiddenLiveRegion.tsx (Astryx 0.6.4, MIT).
// Upstream `aria-live` maps to the shared accessibilityLiveRegion prop;
// `as="div"` keeps the block-level hidden element for the region.
import { Button, HStack, Text, VisuallyHidden, VStack } from '@octane-xplat/ui'
import { useState } from 'octane'

const columns = ['Backlog', 'In progress', 'Done'] as const

export function VisuallyHiddenLiveRegion() {
	const [column, setColumn] = useState(0)
	const current = columns[column]

	function move() {
		setColumn((c) => (c + 1) % columns.length)
	}

	return (
		<VStack gap={4} hAlign="start">
			<Text type="supporting" color="secondary">
				Drag-and-drop and other visual-only changes are silent to screen
				readers. A live region narrates them.
			</Text>
			<HStack gap={3} vAlign="center">
				<Button label="Move task" variant="secondary" clickAction={move} />
				<Text type="body">
					Task is in <Text weight="bold">{current}</Text>
				</Text>
			</HStack>
			<VisuallyHidden as="div" accessibilityLiveRegion="polite">
				{`Task moved to ${current}`}
			</VisuallyHidden>
		</VStack>
	)
}
