// Port of upstream BottomSheet/BottomSheetShowcase.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import {
	BottomSheet,
	Button,
	CheckboxInput,
	Divider,
	Heading,
	Section,
	VStack,
} from '@octane-xplat/ui'

export function BottomSheetShowcase() @{
	const [isOpen, setIsOpen] = useState(false)
	const [inStock, setInStock] = useState(false)
	const [onSale, setOnSale] = useState(false)
	const [freeShipping, setFreeShipping] = useState(false)
	return (
		<>
			<Button label="Open sheet" clickAction={() => setIsOpen(true)} />
			<BottomSheet isOpen={isOpen} onOpenChange={setIsOpen} label="Filters">
				<Section padding={4}>
					<VStack gap={4}>
						<Heading level={3}>Filters</Heading>
						<Divider />
						<VStack gap={2}>
							<CheckboxInput label="In stock" value={inStock} onChange={setInStock} />
							<CheckboxInput label="On sale" value={onSale} onChange={setOnSale} />
							<CheckboxInput
								label="Free shipping"
								value={freeShipping}
								onChange={setFreeShipping}
							/>
						</VStack>
						<Button label="Apply" clickAction={() => setIsOpen(false)} />
					</VStack>
				</Section>
			</BottomSheet>
		</>
	)
}
