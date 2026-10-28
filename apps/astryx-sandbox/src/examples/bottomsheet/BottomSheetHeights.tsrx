// Port of upstream BottomSheet/BottomSheetHeights.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { BottomSheet, Button, Divider, Heading, HStack, Text, VStack } from '@octane-xplat/ui'

type SheetHeight = 'hug' | 'capped' | 'tall'
const descriptions: Record<SheetHeight, string> = {
	hug: 'Hug fits short, bounded content.',
	capped: 'Capped starts at a comfortable mid-height for lists and filters.',
	tall: 'Tall reserves most of the viewport for long or changing content.',
}

export function BottomSheetHeights() @{
	const [height, setHeight] = useState<SheetHeight | null>(null)
	return (
		<>
			<HStack gap={2}>
				<Button label="Open hug" clickAction={() => setHeight('hug')} />
				<Button label="Open capped" clickAction={() => setHeight('capped')} />
				<Button label="Open tall" clickAction={() => setHeight('tall')} />
			</HStack>
			<BottomSheet
				isOpen={height != null}
				onOpenChange={(o) => !o && setHeight(null)}
				label={`${height ?? 'Hug'} height`}
				height={height ?? 'hug'}
			>
				<VStack gap={4} style={{ padding: 'var(--spacing-4)' }}>
					<Heading level={3}>{height ?? 'Hug'} height</Heading>
					<Divider />
					<Text type="body">{descriptions[height ?? 'hug']}</Text>
					<Button label="Close" clickAction={() => setHeight(null)} />
				</VStack>
			</BottomSheet>
		</>
	)
}
